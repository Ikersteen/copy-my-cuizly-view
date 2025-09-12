import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      console.log('Starting audio recorder...');
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
      
      console.log('Audio recorder started successfully');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    console.log('Stopping audio recorder...');
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

export class RealtimeVoiceClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private isConnected = false;
  private audioQueue: HTMLAudioElement[] = [];
  private isPlayingAudio = false;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = false; // Désactivé car on utilisera ElevenLabs
  }

  async connect() {
    try {
      console.log('Connecting to realtime voice...');
      
      // Get ephemeral token from our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("realtime-voice-token");
      
      if (error) {
        console.error('Error getting token:', error);
        throw new Error(`Failed to get ephemeral token: ${error.message}`);
      }
      
      if (!data.client_secret?.value) {
        console.error('No client secret in response:', data);
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      console.log('Got ephemeral token, setting up WebRTC...');

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log('Received remote audio track');
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel for handling events
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event);
        
        // Intercepter les transcriptions pour ElevenLabs
        if (event.type === 'response.audio_transcript.done' && event.transcript) {
          console.log('🎤 Processing transcript with ElevenLabs:', event.transcript);
          await this.processWithElevenLabs(event.transcript);
        }
        
        // Transmettre tous les événements
        this.onMessage(event);
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

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('OpenAI SDP error:', sdpResponse.status, errorText);
        throw new Error(`OpenAI SDP error: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      // Start recording and encoding audio
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: this.encodeAudioData(audioData)
          }));
        }
      });
      await this.recorder.start();

      this.isConnected = true;
      console.log('Realtime voice client connected successfully');

    } catch (error) {
      console.error("Error initializing realtime voice:", error);
      throw error;
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

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    console.log('Sending text message:', text);

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  // Nouvelle méthode pour traiter avec ElevenLabs
  private async processWithElevenLabs(text: string) {
    try {
      console.log('🎤 Generating speech with ElevenLabs for:', text);
      
      const { data, error } = await supabase.functions.invoke("cuizly-voice-elevenlabs", {
        body: { text }
      });
      
      if (error) {
        console.error('ElevenLabs error:', error);
        return;
      }
      
      if (data?.audioContent) {
        await this.playElevenLabsAudio(data.audioContent);
      }
    } catch (error) {
      console.error('Error processing with ElevenLabs:', error);
    }
  }

  // Méthode pour jouer l'audio ElevenLabs
  private async playElevenLabsAudio(base64Audio: string) {
    try {
      console.log('🔊 Playing ElevenLabs audio...');
      
      // Créer un nouvel élément audio
      const audio = new Audio();
      audio.src = `data:audio/mpeg;base64,${base64Audio}`;
      
      // Ajouter à la queue
      this.audioQueue.push(audio);
      
      // Si pas déjà en train de jouer, commencer
      if (!this.isPlayingAudio) {
        await this.playNextAudio();
      }
    } catch (error) {
      console.error('Error playing ElevenLabs audio:', error);
    }
  }

  // Méthode pour jouer la prochaine audio dans la queue
  private async playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const audio = this.audioQueue.shift()!;
    
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        console.log('🔊 Audio finished, playing next...');
        this.playNextAudio().then(resolve);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        this.playNextAudio().then(resolve);
      };
      
      audio.play().catch(e => {
        console.error('Error starting audio playback:', e);
        this.playNextAudio().then(resolve);
      });
    });
  }

  disconnect() {
    console.log('Disconnecting realtime voice client...');
    this.isConnected = false;
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.pc = null;
    this.dc = null;
    this.recorder = null;
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.dc?.readyState === 'open';
  }
}