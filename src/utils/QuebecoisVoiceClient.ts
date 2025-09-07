import { supabase } from "@/integrations/supabase/client";

interface VoiceActivityConfig {
  threshold: number;
  bufferLength: number;
  consecutiveFrames: number;
}

export class VoiceActivityDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private config: VoiceActivityConfig;
  private consecutiveActiveFrames = 0;
  private isActive = false;
  private onVoiceActivity: (isActive: boolean) => void;
  private animationFrameId: number | null = null;

  constructor(
    audioContext: AudioContext, 
    source: MediaStreamAudioSourceNode,
    onVoiceActivity: (isActive: boolean) => void,
    config: Partial<VoiceActivityConfig> = {}
  ) {
    this.audioContext = audioContext;
    this.onVoiceActivity = onVoiceActivity;
    
    this.config = {
      threshold: 30, // Plus sensible pour détecter rapidement
      bufferLength: 512,
      consecutiveFrames: 3, // Nombre de frames consécutives pour confirmer
      ...config
    };

    // Configuration de l'analyseur audio
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = this.config.bufferLength * 2;
    this.analyser.smoothingTimeConstant = 0.1;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    // Connecter la source à l'analyseur
    source.connect(this.analyser);
    
    this.startDetection();
  }

  private startDetection() {
    const detect = () => {
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculer le niveau audio moyen
      const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
      
      if (average > this.config.threshold) {
        this.consecutiveActiveFrames++;
        if (this.consecutiveActiveFrames >= this.config.consecutiveFrames && !this.isActive) {
          this.isActive = true;
          console.log('🎤 Voice activity detected! Interrupting TTS...');
          this.onVoiceActivity(true);
        }
      } else {
        if (this.consecutiveActiveFrames > 0) {
          this.consecutiveActiveFrames--;
        }
        if (this.consecutiveActiveFrames === 0 && this.isActive) {
          this.isActive = false;
          console.log('🔇 Voice activity stopped');
          this.onVoiceActivity(false);
        }
      }

      this.animationFrameId = requestAnimationFrame(detect);
    };
    
    detect();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.analyser.disconnect();
  }
}

export class InterruptibleAudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private onPlayingChange: (playing: boolean) => void;

  constructor(audioContext: AudioContext, onPlayingChange: (playing: boolean) => void) {
    this.audioContext = audioContext;
    this.onPlayingChange = onPlayingChange;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  // FONCTION CRITIQUE : Arrêt immédiat de l'audio
  interrupt() {
    console.log('🛑 Interrupting audio playback immediately!');
    
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = null;
    }
    
    this.queue = []; // Vider la queue
    this.isPlaying = false;
    this.onPlayingChange(false);
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlayingChange(false);
      return;
    }

    this.isPlaying = true;
    this.onPlayingChange(true);
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);
      
      this.currentSource.onended = () => {
        this.currentSource = null;
        this.playNext();
      };
      
      this.currentSource.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.currentSource = null;
      this.playNext();
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

export class QuebecoisVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private vad: VoiceActivityDetector | null = null;
  private audioQueue: InterruptibleAudioQueue | null = null;
  private onMessage: (message: any) => void;
  private onSpeakingChange: (speaking: boolean) => void;
  
  // État de la conversation
  private isUserSpeaking = false;
  private isAssistantSpeaking = false;
  private detectedLanguage = 'fr'; // Default français

  constructor(
    onMessage: (message: any) => void,
    onSpeakingChange: (speaking: boolean) => void
  ) {
    this.onMessage = onMessage;
    this.onSpeakingChange = onSpeakingChange;
  }

  async init(userId: string) {
    try {
      console.log('🇫🇷 Initializing Quebecois voice client...');
      
      // Get ephemeral token
      const tokenResponse = await supabase.functions.invoke('realtime-voice-token');
      
      if (tokenResponse.error || !tokenResponse.data?.client_secret?.value) {
        throw new Error('Failed to get ephemeral token');
      }

      const ephemeralKey = tokenResponse.data.client_secret.value;

      // Setup audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Initialize interruptible audio queue
      this.audioQueue = new InterruptibleAudioQueue(
        this.audioContext,
        (playing) => {
          this.isAssistantSpeaking = playing;
          this.onSpeakingChange(playing);
        }
      );

      // Initialize VAD for interruption detection
      this.vad = new VoiceActivityDetector(
        this.audioContext,
        this.audioSource,
        (isActive) => this.handleVoiceActivity(isActive),
        { threshold: 25, consecutiveFrames: 2 } // Très réactif
      );

      // Create WebSocket connection
      this.ws = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", [
        "realtime",
        `openai-insecure-api-key.${ephemeralKey}`,
        "openai-beta.realtime-v1"
      ]);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.sendSessionUpdate(userId);
        this.startAudioStreaming();
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

    } catch (error) {
      console.error('❌ Error initializing Quebecois voice client:', error);
      throw error;
    }
  }

  private handleVoiceActivity(isActive: boolean) {
    if (isActive && this.isAssistantSpeaking) {
      // INTERRUPTION! L'utilisateur parle pendant que l'assistant répond
      console.log('🚨 USER INTERRUPTION DETECTED! Stopping assistant immediately...');
      this.audioQueue?.interrupt();
      this.isUserSpeaking = true;
      
      this.onMessage({ 
        type: 'interruption', 
        message: 'Interruption détectée - passage en mode écoute' 
      });
    } else if (isActive && !this.isUserSpeaking) {
      this.isUserSpeaking = true;
      this.onMessage({ type: 'user_speaking_started' });
    } else if (!isActive && this.isUserSpeaking) {
      this.isUserSpeaking = false;
      this.onMessage({ type: 'user_speaking_stopped' });
    }
  }

  private sendSessionUpdate(userId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: `Tu es l'assistant vocal Cuizly, l'expert en recommandations culinaires de Montréal. 

PERSONNALITÉ ET ACCENT:
- Parle avec un accent français québécois naturel et chaleureux
- Utilise les expressions québécoises authentiques ("c'est ben bon", "ça tente-tu?", "en masse", etc.)
- Sois enthousiaste pour la bouffe et les découvertes culinaires 
- Ton décontracté et amical comme un ami québécois

DÉTECTION DE LANGUE:
- Si l'utilisateur parle en anglais, réponds en anglais avec ton accent naturel
- Si l'utilisateur parle en français, garde ton québécois
- Adapte-toi naturellement à la langue détectée

RÉPONSES:
- ULTRA COURTES: Max 1-2 phrases courtes pour conversation instantanée
- Sois direct et va droit au but
- Pose UNE question simple si clarification nécessaire
- Suggère rapidement les fonctions pertinentes

INTERRUPTIONS:
- Si tu es interrompu, arrête-toi immédiatement et écoute
- Comme dans une vraie conversation entre amis
- Pas de monologue, conversation dynamique

Exemple: "Salut! Qu'est-ce qui te tente à soir?"`,
        voice: "alloy", // On utilisera ElevenLabs pour le québécois
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.4,
          prefix_padding_ms: 100,
          silence_duration_ms: 300 // Plus court pour réactivité
        },
        tools: [
          {
            type: "function",
            name: "get_recommendations",
            description: "Obtenir des recommandations de restaurants québécois et montréalais",
            parameters: {
              type: "object",
              properties: {
                cuisine: { type: "string", description: "Type de cuisine demandée" },
                location: { type: "string", description: "Quartier ou zone à Montréal" },
                budget: { type: "string", description: "Budget approximatif" }
              },
              required: []
            }
          },
          {
            type: "function", 
            name: "detect_language",
            description: "Détecte la langue de l'utilisateur pour adapter la réponse",
            parameters: {
              type: "object",
              properties: {
                text: { type: "string", description: "Texte à analyser" }
              },
              required: ["text"]
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.9,
        max_response_output_tokens: 100 // Très court pour conversation rapide
      }
    };

    console.log('📤 Sending Quebecois session update');
    this.ws.send(JSON.stringify(sessionConfig));
  }

  private startAudioStreaming() {
    if (!this.audioSource || !this.audioContext) return;

    // Create audio processor for streaming to OpenAI
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const encodedAudio = this.encodeAudioForAPI(new Float32Array(inputData));
        
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: encodedAudio
        }));
      }
    };

    this.audioSource.connect(processor);
    processor.connect(this.audioContext.destination);
    
    console.log('🎤 Audio streaming started with VAD interruption');
  }

  private async handleRealtimeEvent(event: any, userId: string) {
    console.log('📥 Event:', event.type);
    
    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created');
        break;
        
      case 'session.updated':
        console.log('✅ Session updated');
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 User started speaking (server detected)');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🔇 User stopped speaking (server detected)');
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        const transcript = event.transcript;
        console.log('📝 Transcription:', transcript);
        
        // Détection de langue simple
        this.detectedLanguage = this.detectLanguage(transcript);
        console.log('🌍 Detected language:', this.detectedLanguage);
        
        this.onMessage({ 
          type: 'transcript', 
          text: transcript, 
          role: 'user',
          language: this.detectedLanguage
        });
        break;
        
      case 'response.audio.delta':
        if (this.audioQueue && event.delta && !this.isUserSpeaking) {
          // Seulement jouer si l'utilisateur ne parle pas
          const binaryString = atob(event.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await this.audioQueue.addToQueue(bytes);
        }
        break;
        
      case 'response.audio_transcript.delta':
        this.onMessage({ 
          type: 'transcript', 
          text: event.delta, 
          role: 'assistant',
          language: this.detectedLanguage
        });
        break;
        
      case 'response.function_call_arguments.done':
        await this.handleToolCall(event, userId);
        break;
    }
  }

  private detectLanguage(text: string): string {
    // Détection simple basée sur des mots-clés
    const frenchKeywords = ['le', 'la', 'les', 'un', 'une', 'des', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'est', 'sont', 'avec', 'dans', 'pour', 'sur', 'à', 'de', 'du', 'que', 'qui', 'où', 'quand', 'comment', 'pourquoi'];
    const englishKeywords = ['the', 'a', 'an', 'is', 'are', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'where', 'when', 'how', 'why', 'i', 'you', 'he', 'she', 'we', 'they'];
    
    const words = text.toLowerCase().split(/\s+/);
    let frenchScore = 0;
    let englishScore = 0;
    
    words.forEach(word => {
      if (frenchKeywords.includes(word)) frenchScore++;
      if (englishKeywords.includes(word)) englishScore++;
    });
    
    return frenchScore > englishScore ? 'fr' : 'en';
  }

  private async handleToolCall(event: any, userId: string) {
    console.log('🔧 Tool call:', event.name);
    
    try {
      const response = await supabase.functions.invoke('voice-tools-handler', {
        body: {
          toolName: event.name,
          arguments: JSON.parse(event.arguments),
          userId,
          language: this.detectedLanguage
        }
      });

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
    console.log('🔌 Disconnecting Quebecois voice client');
    this.cleanup();
  }

  private cleanup() {
    this.vad?.stop();
    this.audioQueue?.interrupt();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}