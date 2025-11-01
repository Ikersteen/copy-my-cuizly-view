import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(
    private onAudioData: (audioData: Float32Array) => void,
    private existingStream?: MediaStream
  ) {}

  async start() {
    try {
      // Utiliser le stream existant si disponible
      this.stream = this.existingStream || await navigator.mediaDevices.getUserMedia({
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
        
        // Calculer le niveau audio pour éviter d'envoyer du silence constant
        const audioLevel = inputData.reduce((sum, sample) => sum + Math.abs(sample), 0) / inputData.length;
        
        // Seuil de silence pour éviter l'envoi continu d'audio vide
        if (audioLevel > 0.01) {
          this.onAudioData(new Float32Array(inputData));
        }
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
    // Ne pas arrêter le stream s'il était fourni de l'extérieur
    if (this.stream && !this.existingStream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.stream = null;
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
  private mediaStream: MediaStream | null = null;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async connect() {
    try {
      // Demander la permission microphone UNE SEULE FOIS
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }
      
      // Get current language
      const currentLanguage = localStorage.getItem('i18nextLng') || 'fr';
      
      // Get ephemeral token from our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("realtime-voice-token", {
        body: { language: currentLanguage }
      });
      
      if (error) {
        console.error('Error getting token:', error);
        throw new Error(`Failed to get ephemeral token: ${error.message}`);
      }
      
      if (!data.client_secret?.value) {
        console.error('No client secret in response:', data);
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio - lecture silencieuse
      this.pc.ontrack = e => {
        this.audioEl.srcObject = e.streams[0];
        this.audioEl.autoplay = true;
        this.audioEl.play().catch(() => {});
      };

      // Utiliser le stream déjà autorisé
      this.pc.addTrack(this.mediaStream.getTracks()[0]);

      // Set up data channel for handling events
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);
        
        // Détecter les appels de fonction
        if (event.type === 'response.function_call_arguments.done') {
          const functionName = event.name;
          const args = JSON.parse(event.arguments);
          
          if (functionName === 'end_conversation') {
            // L'utilisateur veut terminer - fermer immédiatement
            this.onMessage({ type: 'user_wants_to_end' });
            return;
          } else if (functionName === 'search_restaurants') {
            // Rechercher des restaurants
            const result = await this.searchRestaurants(args.query, args.location);
            
            // Envoyer le résultat à OpenAI
            if (this.dc?.readyState === 'open') {
              this.dc.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: event.call_id,
                  output: JSON.stringify(result)
                }
              }));
            }
          }
        }
        
        // Logger les événements audio importants
        if (event.type === 'response.audio.delta' || event.type === 'response.audio.done') {
          // Audio events for status
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

      // Start recording and encoding audio avec le stream existant
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: this.encodeAudioData(audioData)
          }));
        }
      }, this.mediaStream);
      await this.recorder.start();

      this.isConnected = true;

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

  // Rechercher des restaurants via Lovable AI
  private async searchRestaurants(query: string, location?: string): Promise<any> {
    try {
      const searchQuery = location 
        ? `${query} restaurants in ${location}, Canada with menu, reviews, and contact information`
        : `${query} restaurants in Canada with menu, reviews, and contact information`;
      
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: { 
          prompt: searchQuery,
          type: "recommend"
        }
      });
      
      if (error) {
        return { error: "Unable to search restaurants at the moment" };
      }
      
      return { 
        results: data?.recommendations || data?.text || "No restaurants found",
        source: "Cuizly database"
      };
    } catch (error) {
      return { error: "Search failed" };
    }
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
  private async playNextAudio(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const audio = this.audioQueue.shift()!;
    
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        console.log('🔊 Audio finished, playing next...');
        // Utiliser setTimeout pour éviter la récursion synchrone
        setTimeout(() => {
          this.playNextAudio().then(resolve);
        }, 100);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        // Utiliser setTimeout pour éviter la récursion synchrone
        setTimeout(() => {
          this.playNextAudio().then(resolve);
        }, 100);
      };
      
      audio.play().catch(e => {
        console.error('Error starting audio playback:', e);
        // Utiliser setTimeout pour éviter la récursion synchrone
        setTimeout(() => {
          this.playNextAudio().then(resolve);
        }, 100);
      });
    });
  }

  disconnect() {
    this.isConnected = false;
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.pc = null;
    this.dc = null;
    this.recorder = null;
    // Garder le mediaStream pour la prochaine connexion
  }

  // Méthode pour libérer complètement les ressources (appelée quand on désactive complètement l'assistant)
  cleanup() {
    this.disconnect();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.dc?.readyState === 'open';
  }
}