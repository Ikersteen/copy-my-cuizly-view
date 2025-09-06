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
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
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

class AudioQueue {
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
      console.error('❌ Error playing audio:', error);
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
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private audioQueue: AudioQueue | null = null;
  private audioContext: AudioContext | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private onSpeakingChange: (speaking: boolean) => void
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(userId: string) {
    try {
      console.log('🎙️ Initializing voice client...');
      
      // Get ephemeral token from our Edge Function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("voice-token-generator");
      
      if (tokenError || !tokenData?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log('✅ Got ephemeral token');

      // Initialize audio context and queue
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = (e) => {
        console.log('🎵 Remote audio track received');
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        this.handleRealtimeEvent(event, userId);
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log('✅ WebRTC connection established');

      // Wait for data channel to be open
      await new Promise((resolve) => {
        if (this.dc?.readyState === 'open') {
          resolve(true);
        } else {
          this.dc!.addEventListener('open', () => resolve(true));
        }
      });

      // Send session update with tools
      this.sendSessionUpdate(userId);

      console.log('🎙️ Voice client ready!');

    } catch (error) {
      console.error("❌ Error initializing voice client:", error);
      throw error;
    }
  }

  private sendSessionUpdate(userId: string) {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: `Tu es l'assistant vocal de Cuizly pour l'utilisateur ${userId}. Parle en français québécois naturel et chaleureux.`,
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
            name: "get_recommendations",
            description: "Cherche des recommandations de restaurants selon les critères de l'utilisateur",
            parameters: {
              type: "object",
              properties: {
                cuisine_types: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Types de cuisine recherchés"
                },
                budget_range: { 
                  type: "string", 
                  description: "Budget: low, moderate, high"
                },
                location: { 
                  type: "string", 
                  description: "Localisation à Montréal"
                }
              }
            }
          },
          {
            type: "function",
            name: "get_user_preferences",
            description: "Récupère les préférences alimentaires de l'utilisateur",
            parameters: {
              type: "object",
              properties: {}
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.8
      }
    };

    console.log('📤 Sending session update with tools');
    this.dc.send(JSON.stringify(sessionUpdate));
  }

  private async handleRealtimeEvent(event: any, userId: string) {
    console.log('📨 Realtime event:', event.type);
    
    switch (event.type) {
      case 'response.audio.delta':
        if (event.delta) {
          this.onSpeakingChange(true);
          const binaryString = atob(event.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          if (this.audioQueue) {
            await this.audioQueue.addToQueue(bytes);
          }
        }
        break;

      case 'response.audio.done':
        this.onSpeakingChange(false);
        break;

      case 'response.function_call_arguments.done':
        await this.handleToolCall(event, userId);
        break;

      case 'response.audio_transcript.delta':
        this.onMessage({
          type: 'transcript',
          text: event.delta,
          role: 'assistant'
        });
        break;

      default:
        this.onMessage(event);
    }
  }

  private async handleToolCall(event: any, userId: string) {
    try {
      const { name, arguments: argsStr } = event;
      const args = JSON.parse(argsStr);
      
      console.log('🔧 Tool call:', name, args);

      // Call our voice tools handler
      const { data: result, error } = await supabase.functions.invoke('voice-tools-handler', {
        body: {
          tool_name: name,
          arguments: args,
          user_id: userId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Send tool response back to OpenAI
      if (this.dc && this.dc.readyState === 'open') {
        this.dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify(result)
          }
        }));

        // Trigger response generation
        this.dc.send(JSON.stringify({ type: 'response.create' }));
      }

    } catch (error) {
      console.error('❌ Tool call error:', error);
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
    console.log('🔌 Disconnecting voice client');
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.audioContext?.close();
    this.onSpeakingChange(false);
  }
}