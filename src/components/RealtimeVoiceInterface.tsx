import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RealtimeVoiceInterfaceProps {
  onClose?: () => void;
}

const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      setIsConnecting(true);
      
      // Get ephemeral token from our edge function
      const tokenResponse = await supabase.functions.invoke('realtime-voice-token');
      
      if (tokenResponse.error) {
        throw new Error('Failed to get voice token');
      }

      const { client_secret } = tokenResponse.data;
      if (!client_secret?.value) {
        throw new Error('No ephemeral token received');
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Get microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Connect to OpenAI Realtime API
      const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`);
      
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('🎙️ Connected to OpenAI Realtime API');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `Tu es l'assistant vocal Cuizly, l'expert en recommandations culinaires de Montréal. Parle en français québécois naturel et chaleureux. Sois enthousiaste pour la bouffe et découvertes culinaires. Utilise un ton amical et décontracté. Sois bref mais informatif (max 2-3 phrases). Tu peux chercher des recommandations de restaurants, expliquer les fonctionnalités de l'app, et aider avec les préférences alimentaires.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8,
            max_response_output_tokens: 'inf'
          }
        }));

        startAudioStreaming();
        
        toast({
          title: "Connexion établie",
          description: "Vous pouvez maintenant parler avec Cuizly en temps réel",
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter au service vocal",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error('Error connecting:', error);
      setIsConnecting(false);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de connexion",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    // Stop audio streaming
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const startAudioStreaming = () => {
    if (!streamRef.current || !websocketRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          // Convert audio to PCM16 and send to OpenAI
          convertAndSendAudio(event.data);
        }
      };

      // Start recording in chunks
      mediaRecorder.start(100); // 100ms chunks for real-time
      setIsListening(true);
      
    } catch (error) {
      console.error('Error starting audio streaming:', error);
    }
  };

  const convertAndSendAudio = async (audioData: Blob) => {
    try {
      const arrayBuffer = await audioData.arrayBuffer();
      const audioContext = audioContextRef.current;
      
      if (!audioContext || !websocketRef.current) return;

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const pcmData = audioBuffer.getChannelData(0);
      
      // Convert to PCM16
      const pcm16 = new Int16Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        const s = Math.max(-1, Math.min(1, pcmData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Convert to base64
      const uint8Array = new Uint8Array(pcm16.buffer);
      let binary = '';
      const chunkSize = 0x8000;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);
      
      // Send to OpenAI
      websocketRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
      
    } catch (error) {
      console.error('Error converting audio:', error);
    }
  };

  const handleRealtimeEvent = (event: any) => {
    console.log('Realtime event:', event.type, event);
    
    switch (event.type) {
      case 'session.created':
        console.log('Session created successfully');
        break;
        
      case 'session.updated':
        console.log('Session updated');
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        // Stop any playing audio when user starts speaking
        setIsSpeaking(false);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'response.audio.delta':
        if (event.delta) {
          playAudioDelta(event.delta);
          setIsSpeaking(true);
        }
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        break;
        
      case 'response.audio_transcript.delta':
        // Handle transcript if needed
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          addMessage('user', event.transcript);
        }
        break;
        
      case 'response.done':
        setIsSpeaking(false);
        break;
        
      case 'error':
        console.error('Realtime API error:', event);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite pendant la conversation",
          variant: "destructive",
        });
        break;
    }
  };

  const playAudioDelta = async (audioData: string) => {
    try {
      if (!audioContextRef.current) return;

      // Decode base64 to PCM16
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const pcm16 = new Int16Array(bytes.buffer);
      const pcmFloat = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        pcmFloat[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, pcmFloat.length, 24000);
      audioBuffer.getChannelData(0).set(pcmFloat);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
    } catch (error) {
      console.error('Error playing audio delta:', error);
    }
  };

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Assistant Vocal Temps Réel</h2>
          <p className="text-sm text-muted-foreground">
            Conversation naturelle avec interruption
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Voice Orb - Similar to ChatGPT */}
        <div className="relative mb-8">
          <div className={`w-32 h-32 rounded-full transition-all duration-300 ${
            isSpeaking 
              ? 'bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse shadow-2xl shadow-blue-500/50' 
              : isListening 
                ? 'bg-gradient-to-br from-green-400 to-green-600 animate-pulse shadow-xl shadow-green-500/30'
                : isConnected
                  ? 'bg-gradient-to-br from-blue-300 to-blue-500 shadow-lg'
                  : 'bg-gradient-to-br from-gray-300 to-gray-500'
          }`}>
            <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm" />
            <div className="absolute inset-4 rounded-full bg-white/30 backdrop-blur-sm" />
            
            {/* Microphone icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isConnected ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          {/* Animated rings when speaking */}
          {isSpeaking && (
            <div className="absolute inset-0 -m-4">
              <div className="w-40 h-40 rounded-full border-2 border-blue-400 animate-ping opacity-20" />
              <div className="absolute inset-2 w-36 h-36 rounded-full border-2 border-blue-300 animate-ping opacity-30 animation-delay-75" />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="text-lg font-medium mb-2">
            {isConnecting ? 'Connexion...' :
             isConnected ? 
               (isSpeaking ? 'Cuizly parle...' : 
                isListening ? 'Vous parlez...' : 
                'En attente...') :
             'Déconnecté'}
          </div>
          <div className="text-sm text-muted-foreground">
            {isConnected ? 
              'Parlez naturellement, vous pouvez interrompre à tout moment' :
              'Appuyez pour commencer la conversation vocale'}
          </div>
        </div>

        {/* Connect/Disconnect Button */}
        <Button 
          onClick={toggleConnection}
          disabled={isConnecting}
          className={`px-8 py-3 ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isConnecting ? 'Connexion...' :
           isConnected ? 'Terminer la conversation' : 
           'Commencer la conversation'}
        </Button>
      </div>

      {/* Messages (if any) */}
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-4 border-t bg-muted/30">
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className={`text-sm ${
                message.type === 'user' ? 'text-blue-600' : 'text-green-600'
              }`}>
                <span className="font-medium">
                  {message.type === 'user' ? 'Vous: ' : 'Cuizly: '}
                </span>
                {message.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeVoiceInterface;