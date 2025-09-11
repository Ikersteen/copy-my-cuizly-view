import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext(); // Continue with next segment even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header parameters
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}

export class RealtimeVoiceClient {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueue | null = null;
  
  // Event handlers - made public for external access
  public onMessage?: (message: any) => void;
  public onSpeakingChange?: (speaking: boolean) => void;

  constructor() {
    // Constructor vide
  }

  async init(userId: string) {
    try {
      console.log('🎙️ Initializing realtime voice client...');
      
      // Get ephemeral token from our edge function
      const tokenResponse = await supabase.functions.invoke('realtime-voice-token');
      
      if (tokenResponse.error || !tokenResponse.data?.client_secret?.value) {
        throw new Error('Failed to get ephemeral token');
      }

      const ephemeralKey = tokenResponse.data.client_secret.value;

      // Create WebSocket connection to OpenAI Realtime API
      this.ws = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", [
        "realtime",
        `openai-insecure-api-key.${ephemeralKey}`,
        "openai-beta.realtime-v1"
      ]);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to OpenAI Realtime API');
        this.sendSessionUpdate(userId);
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealtimeEvent(data, userId);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        this.cleanup();
      };

      // Initialize audio context and recorder
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);
      
      // Start recording
      this.recorder = new AudioRecorder((audioData) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const encodedAudio = this.encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });
      
      await this.recorder.start();
      console.log('🎤 Audio recording started');

    } catch (error) {
      console.error('❌ Error initializing realtime voice client:', error);
      throw error;
    }
  }

  private sendSessionUpdate(userId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: `Tu es l'assistant vocal Cuizly, l'expert en recommandations culinaires de Montréal. 

PERSONNALITÉ:
- Parle en français québécois naturel et chaleureux
- Sois enthousiaste pour la bouffe et découvertes culinaires
- Utilise un ton amical et décontracté
- RÉPONSES ULTRA COURTES: max 1-2 phrases, sois direct

FONCTIONNALITÉS:
- Tu peux chercher des recommandations de restaurants avec get_recommendations
- Tu peux expliquer les fonctionnalités de l'app
- Tu peux aider avec les préférences alimentaires

RÉPONSES:
- IMPORTANT: Garde tes réponses hyper courtes pour conversation instantanée
- Pose UNE question simple si tu as besoin de clarification
- Suggère rapidement les fonctions si pertinent

Exemple: "Salut! Qu'est-ce qui te tente?"`,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.3,
          prefix_padding_ms: 150,
          silence_duration_ms: 400
        },
        response: {
          modalities: ["audio", "text"],
          instructions: "Réponds de façon très brève et naturelle en français."
        },
        tools: [
          {
            type: "function",
            name: "get_recommendations",
            description: "Obtenir des recommandations de restaurants basées sur les préférences utilisateur",
            parameters: {
              type: "object",
              properties: {
                cuisine: { type: "string", description: "Type de cuisine demandée" },
                location: { type: "string", description: "Quartier ou zone à Montréal" },
                budget: { type: "string", description: "Budget approximatif (bas, moyen, élevé)" }
              },
              required: []
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.9,
        max_response_output_tokens: 150
      }
    };

    console.log('📤 Sending session update');
    this.ws.send(JSON.stringify(sessionConfig));
  }

  private async handleRealtimeEvent(event: any, userId: string) {
    console.log('📥 Received event:', event.type);
    
    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created');
        break;
        
      case 'session.updated':
        console.log('✅ Session updated');
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 User started speaking');
        this.onMessage({ type: 'user_speaking_started' });
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🔇 User stopped speaking');
        this.onMessage({ type: 'user_speaking_stopped' });
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        console.log('📝 Transcription:', event.transcript);
        this.onMessage({ 
          type: 'transcript', 
          text: event.transcript, 
          role: 'user' 
        });
        break;
        
      case 'response.audio.delta':
        if (this.audioQueue && event.delta) {
          const binaryString = atob(event.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await this.audioQueue.addToQueue(bytes);
          this.onSpeakingChange(true);
        }
        break;
        
      case 'response.audio.done':
        this.onSpeakingChange(false);
        break;
        
      case 'response.audio_transcript.delta':
        this.onMessage({ 
          type: 'transcript', 
          text: event.delta, 
          role: 'assistant' 
        });
        break;
        
      case 'response.function_call_arguments.done':
        await this.handleToolCall(event, userId);
        break;
        
      default:
        console.log('🔍 Unhandled event:', event.type);
    }
  }

  private async handleToolCall(event: any, userId: string) {
    console.log('🔧 Tool call:', event.name, event.arguments);
    
    try {
      // Call our Supabase function to handle the tool call
      const response = await supabase.functions.invoke('voice-tools-handler', {
        body: {
          toolName: event.name,
          arguments: JSON.parse(event.arguments),
          userId
        }
      });

      // Send the result back to OpenAI
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify(response.data || { result: "Tool executed" })
          }
        }));
      }
    } catch (error) {
      console.error('❌ Tool call error:', error);
    }
  }

  private encodeAudioForAPI(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  disconnect() {
    console.log('🔌 Disconnecting realtime voice client');
    this.cleanup();
  }

  private cleanup() {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = null;
  }
}