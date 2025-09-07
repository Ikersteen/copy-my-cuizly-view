import { supabase } from '@/integrations/supabase/client';

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
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
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
    // Convert bytes to 16-bit samples (little endian)
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
  private audioRecorder: AudioRecorder | null = null;
  private audioQueue: AudioQueue | null = null;
  private audioContext: AudioContext | null = null;
  private isSessionActive = false;

  constructor(
    private onMessage: (message: any) => void,
    private onConnectionChange: (connected: boolean) => void,
    private onSpeakingChange: (speaking: boolean) => void
  ) {}

  async init(userId: string) {
    try {
      console.log('Initializing Realtime Voice Client...');

      // Get ephemeral token from our Supabase Edge Function
      const { data: tokenData, error } = await supabase.functions.invoke('realtime-voice-token');
      
      if (error || !tokenData) {
        throw new Error(`Failed to get ephemeral token: ${error?.message || 'Unknown error'}`);
      }

      if (!tokenData.client_secret?.value) {
        throw new Error("No client secret in token response");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log('Got ephemeral token, connecting to OpenAI...');

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Connect to OpenAI's Realtime API
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
      this.ws = new WebSocket(wsUrl);
      
      // Set authorization header through custom headers isn't supported in browser WebSocket
      // We'll send auth as first message instead

      this.ws.onopen = () => {
        console.log('WebSocket connected to OpenAI Realtime API');
        // Send authorization as first message since browser WebSocket doesn't support custom headers
        if (this.ws) {
          this.ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: 'You are a helpful assistant.',
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              turn_detection: {
                type: 'server_vad'
              }
            }
          }));
        }
        this.onConnectionChange(true);
      };

      this.ws.onmessage = (event) => {
        this.handleRealtimeEvent(JSON.parse(event.data), userId);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onConnectionChange(false);
        this.isSessionActive = false;
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onConnectionChange(false);
      };

      // Start audio recording
      this.audioRecorder = new AudioRecorder((audioData) => {
        if (this.ws?.readyState === WebSocket.OPEN && this.isSessionActive) {
          const encoded = this.encodeAudioData(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });

      await this.audioRecorder.start();

    } catch (error) {
      console.error('Error initializing voice client:', error);
      this.onConnectionChange(false);
      throw error;
    }
  }

  private async sendSessionUpdate(userId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    console.log('Sending session update...');
    
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: `Tu es Cuizly, l'assistant culinaire IA de Montréal. Tu aides les utilisateurs à découvrir les meilleurs restaurants et plats de la ville.

PERSONNALITÉ:
- Chaleureux, enthousiaste et passionné par la nourriture
- Expert de la scène culinaire montréalaise
- Parle français naturellement (l'utilisateur est à Montréal)
- Utilise un ton amical et conversationnel

CAPACITÉS:
- Recommandations de restaurants personnalisées
- Informations sur les spécialités locales
- Conseils culinaires et suggestions de plats
- Aide à la découverte de nouveaux endroits

STYLE DE CONVERSATION:
- Réponds de manière naturelle et conversationnelle
- Pose des questions pour mieux comprendre les préférences
- Partage des anecdotes sur les restaurants de Montréal
- Sois concis mais informatif dans tes réponses vocales`,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        tools: [
          {
            type: "function",
            name: "get_restaurant_recommendations",
            description: "Obtenir des recommandations de restaurants personnalisées pour l'utilisateur",
            parameters: {
              type: "object",
              properties: {
                preferences: {
                  type: "string",
                  description: "Les préférences culinaires de l'utilisateur"
                }
              },
              required: ["preferences"]
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.8,
        max_response_output_tokens: "inf"
      }
    };

    this.ws.send(JSON.stringify(sessionUpdate));
  }

  private async handleRealtimeEvent(event: any, userId: string) {
    console.log('Received event:', event.type, event);

    switch (event.type) {
      case 'session.created':
        console.log('Session created, sending session update...');
        this.isSessionActive = true;
        await this.sendSessionUpdate(userId);
        break;

      case 'session.updated':
        console.log('Session updated successfully');
        break;

      case 'response.audio.delta':
        if (event.delta && this.audioQueue) {
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
        console.log('Audio response completed');
        this.onSpeakingChange(false);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.onMessage({
          type: 'transcript',
          text: event.transcript,
          role: 'user',
          timestamp: new Date()
        });
        break;

      case 'response.text.delta':
        this.onMessage({
          type: 'transcript',
          text: event.delta,
          role: 'assistant',
          timestamp: new Date(),
          isPartial: true
        });
        break;

      case 'response.function_call_arguments.done':
        await this.handleToolCall(event, userId);
        break;

      case 'error':
        console.error('OpenAI Realtime API error:', event);
        break;
    }
  }

  private async handleToolCall(event: any, userId: string) {
    try {
      console.log('Handling tool call:', event.name, event.arguments);
      
      if (event.name === 'get_restaurant_recommendations') {
        const { data, error } = await supabase.functions.invoke('voice-tools-handler', {
          body: {
            tool_name: 'get_recommendations',
            arguments: JSON.parse(event.arguments),
            user_id: userId
          }
        });

        const result = error ? { error: error.message } : data;

        // Send the result back to OpenAI
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: JSON.stringify(result)
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error handling tool call:', error);
    }
  }

  private encodeAudioData(float32Array: Float32Array): string {
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
    console.log('Disconnecting voice client...');
    
    this.audioRecorder?.stop();
    this.audioRecorder = null;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioQueue = null;
    this.isSessionActive = false;
    this.onConnectionChange(false);
    this.onSpeakingChange(false);
  }
}