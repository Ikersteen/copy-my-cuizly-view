import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Settings, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceWaveAnimation from './VoiceWaveAnimation';
import { AudioRecorder, AudioQueue, encodeAudioForAPI, calculateAudioLevel } from '@/utils/audioUtils';

interface VoiceInterfaceProps {
  className?: string;
  onAction?: (action: string, data?: any) => void;
}

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ className, onAction }) => {
  const { toast } = useToast();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Messages
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context and queue
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
        console.log("Audio system initialized");
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle audio data from microphone
  const handleAudioData = useCallback((audioData: Float32Array) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Calculate audio level for visual feedback
    const level = calculateAudioLevel(audioData);
    setAudioLevel(level);

    // Encode and send to WebSocket
    const encodedAudio = encodeAudioForAPI(audioData);
    wsRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: encodedAudio
    }));
  }, []);

  // Connect to voice service
  const connectToVoice = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to WebSocket
      const wsUrl = 'wss://ffgkzvnbsdnfgmcxturx.supabase.co/functions/v1/cuizly-voice-chat';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("Connected to Cuizly Voice");
        setIsConnected(true);
        setIsConnecting(false);
        
        toast({
          title: "Connexion établie",
          description: "Assistant vocal Cuizly prêt à vous aider",
        });
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received:", data.type);

          switch (data.type) {
            case 'connection':
              if (data.status === 'connected') {
                setIsConnected(true);
              } else if (data.status === 'disconnected') {
                setIsConnected(false);
              }
              break;

            case 'session.created':
              console.log("Voice session created");
              break;

            case 'response.audio.delta':
              // Play audio response
              if (audioQueueRef.current && !isMuted) {
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                await audioQueueRef.current.addToQueue(bytes);
                setIsSpeaking(true);
              }
              break;

            case 'response.audio.done':
              setIsSpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              // Update assistant message transcript
              if (data.delta) {
                setCurrentTranscript(prev => prev + data.delta);
              }
              break;

            case 'response.audio_transcript.done':
              // Finalize assistant message
              if (currentTranscript) {
                const newMessage: VoiceMessage = {
                  id: Date.now().toString(),
                  type: 'assistant',
                  content: currentTranscript,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, newMessage]);
                setCurrentTranscript('');
              }
              break;

            case 'conversation.item.input_audio_transcription.completed':
              // User speech transcription completed
              if (data.transcript) {
                const userMessage: VoiceMessage = {
                  id: Date.now().toString(),
                  type: 'user',
                  content: data.transcript,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, userMessage]);
              }
              break;

            case 'cuizly_action':
              // Handle Cuizly-specific actions
              console.log("Cuizly action:", data.action, data.data);
              onAction?.(data.action, data.data);
              
              // Show toast for action feedback
              const actionMessages = {
                search_restaurants: "Recherche de restaurants en cours...",
                show_favorites: "Affichage de vos favoris...",
                add_to_favorites: "Restaurant ajouté aux favoris!",
                show_offers: "Affichage des offres du jour..."
              };
              
              toast({
                title: "Action effectuée",
                description: actionMessages[data.action as keyof typeof actionMessages] || "Action traitée",
              });
              break;

            case 'error':
              console.error("Voice service error:", data.message);
              toast({
                title: "Erreur",
                description: data.message,
                variant: "destructive",
              });
              break;
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setIsConnecting(false);
        
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter au service vocal",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        setIsConnected(false);
        setIsConnecting(false);
        setIsRecording(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error("Failed to connect:", error);
      setIsConnecting(false);
      
      toast({
        title: "Erreur",
        description: "Accès au microphone requis pour utiliser l'assistant vocal",
        variant: "destructive",
      });
    }
  };

  // Disconnect from voice service
  const disconnectFromVoice = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    audioQueueRef.current?.clear();
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  // Toggle recording
  const toggleRecording = async () => {
    if (!isConnected) return;

    if (isRecording) {
      // Stop recording
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      setIsRecording(false);
      setAudioLevel(0);
    } else {
      // Start recording
      try {
        recorderRef.current = new AudioRecorder(handleAudioData);
        await recorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'accéder au microphone",
          variant: "destructive",
        });
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      audioQueueRef.current?.clear();
      setIsSpeaking(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromVoice();
    };
  }, []);

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* User Status Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-background to-muted/20 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Hello, Cuizly User</h3>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <span className="text-xs">★</span> PREMIUM
            </Badge>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Voice Wave Animation */}
        <div className="mb-4">
          <VoiceWaveAnimation 
            isActive={isRecording || isSpeaking} 
            audioLevel={audioLevel}
            className="h-20"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isConnected ? (
            <Button
              onClick={connectToVoice}
              disabled={isConnecting}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isConnecting ? "Connexion..." : "Démarrer l'assistant vocal"}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className={cn(
                  "w-12 h-12 rounded-full",
                  isMuted ? "bg-destructive/10 text-destructive" : "bg-muted"
                )}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <Button
                size="icon"
                onClick={toggleRecording}
                className={cn(
                  "w-16 h-16 rounded-full transition-all duration-200",
                  isRecording 
                    ? "bg-destructive hover:bg-destructive/90 scale-110" 
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>

              <Button
                variant="outline"
                onClick={disconnectFromVoice}
                className="px-4"
              >
                Arrêter
              </Button>
            </>
          )}
        </div>

        {/* Status Messages */}
        {isConnected && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isRecording 
                ? "🎤 En écoute... Parlez maintenant"
                : isSpeaking 
                ? "🔊 Assistant en train de répondre..."
                : "Appuyez sur le micro pour parler"
              }
            </p>
          </div>
        )}
      </Card>

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Conversation récente</h4>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {messages.slice(-3).map((message) => (
              <div key={message.id} className="flex items-start gap-2">
                <Badge variant={message.type === 'user' ? 'default' : 'secondary'} className="text-xs">
                  {message.type === 'user' ? 'Vous' : 'Assistant'}
                </Badge>
                <p className="text-sm flex-1">{message.content}</p>
              </div>
            ))}
            {currentTranscript && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">Assistant</Badge>
                <p className="text-sm flex-1 italic">{currentTranscript}...</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default VoiceInterface;