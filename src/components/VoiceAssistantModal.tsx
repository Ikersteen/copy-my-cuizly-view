import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceWaveAnimation from './VoiceWaveAnimation';
import { AudioRecorder, AudioQueue, encodeAudioForAPI, calculateAudioLevel } from '@/utils/audioUtils';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useFavorites } from '@/hooks/useFavorites';
import { useAddresses } from '@/hooks/useAddresses';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RecommendationResult {
  id: string;
  name: string;
  cuisine_type: string[];
  price_range: string;
  ai_score: number;
  ai_reasons: string[];
  description?: string;
  average_rating?: number;
}

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  
  // Hooks pour l'intégration avec les systèmes existants
  const { preferences } = useUserPreferences();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { getPrimaryAddressByType } = useAddresses('user_delivery');
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Messages et résultats
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context and queue
  useEffect(() => {
    if (!open) return;
    
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
  }, [open]);

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
      
      // Get user context for better recommendations
      const userAddress = getPrimaryAddressByType('user_delivery');
      const userContext = {
        preferences: preferences,
        address: userAddress?.formatted_address,
        favorites: favorites
      };
      
      // Connect to WebSocket with user context
      const wsUrl = 'wss://ffgkzvnbsdnfgmcxturx.supabase.co/functions/v1/cuizly-voice-chat';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("Connected to Cuizly Voice Assistant");
        setIsConnected(true);
        setIsConnecting(false);
        
        // Send user context after connection
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'user_context',
            context: userContext
          }));
        }
        
        toast({
          title: "Assistant vocal activé",
          description: "Bonjour ! Je suis votre assistant culinaire Cuizly. Comment puis-je vous aider ?",
        });
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received:", data.type);

          switch (data.type) {
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
              await handleCuizlyAction(data.action, data.data);
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

  // Handle Cuizly actions from the voice assistant
  const handleCuizlyAction = async (action: string, data: any) => {
    console.log("Handling Cuizly action:", action, data);
    
    try {
      switch (action) {
        case 'get_recommendations':
          await getRecommendations(data);
          break;
        case 'add_to_favorites':
          if (data.restaurantId) {
            await toggleFavorite(data.restaurantId);
            toast({
              title: "Favori ajouté",
              description: `${data.restaurantName || 'Restaurant'} ajouté à vos favoris`,
            });
          }
          break;
        case 'show_favorites':
          // This would trigger the favorites modal in the parent component
          toast({
            title: "Favoris",
            description: `Vous avez ${favorites.length} restaurants favoris`,
          });
          break;
        case 'get_user_preferences':
          return {
            preferences: preferences,
            address: getPrimaryAddressByType('user_delivery')?.formatted_address,
            favorites_count: favorites.length
          };
        default:
          console.log("Unknown action:", action);
      }
    } catch (error) {
      console.error("Error handling Cuizly action:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre demande",
        variant: "destructive",
      });
    }
  };

  // Get recommendations using existing AI system
  const getRecommendations = async (searchParams: any) => {
    try {
      // Simulate restaurant data - in real app, this would come from your restaurant database
      const mockRestaurants = [
        {
          id: '1',
          name: 'Sushi Zen',
          cuisine_type: ['japonaise'],
          price_range: '$$',
          description: 'Authentique restaurant japonais',
          average_rating: 4.5
        },
        {
          id: '2',
          name: 'Pasta Bella',
          cuisine_type: ['italienne'],
          price_range: '$',
          description: 'Délicieuses pâtes maison',
          average_rating: 4.2
        }
      ];

      // Use existing AI recommendations system
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          restaurants: mockRestaurants,
          preferences: preferences,
          language: 'fr'
        }
      });

      if (error) throw error;

      const recs = data.recommendations || [];
      setRecommendations(recs);

      toast({
        title: "Recommandations trouvées",
        description: `${recs.length} restaurants correspondent à vos critères`,
      });

    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir les recommandations",
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

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      disconnectFromVoice();
      setMessages([]);
      setRecommendations([]);
      setCurrentTranscript('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              Assistant Vocal Cuizly
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Zone centrale - Interface vocale */}
          <div className="flex-1 flex flex-col p-6">
            {/* Status */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )} />
                <span className="text-sm font-medium">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? (isRecording 
                    ? "🎤 En écoute... Parlez maintenant"
                    : isSpeaking 
                    ? "🔊 Assistant en train de répondre..."
                    : "Appuyez sur le micro pour parler")
                  : "Cliquez sur 'Démarrer' pour activer l'assistant vocal"
                }
              </p>
            </div>

            {/* Voice Wave Animation */}
            <div className="flex-1 flex items-center justify-center mb-6">
              <VoiceWaveAnimation 
                isActive={isRecording || isSpeaking} 
                audioLevel={audioLevel}
                className="h-32 max-w-md"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isConnected ? (
                <Button
                  onClick={connectToVoice}
                  disabled={isConnecting}
                  className="flex-1 max-w-xs bg-primary hover:bg-primary/90"
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

            {/* Recent Messages */}
            {messages.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Conversation</h4>
                  <div className="space-y-3 max-h-32 overflow-y-auto">
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Résultats */}
          {recommendations.length > 0 && (
            <div className="w-80 border-l bg-muted/20 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Recommandations</h3>
              <div className="space-y-3">
                {recommendations.map((restaurant) => (
                  <Card key={restaurant.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{restaurant.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {restaurant.cuisine_type.join(', ')} • {restaurant.price_range}
                        </p>
                        {restaurant.ai_reasons && (
                          <p className="text-xs text-primary mt-1">
                            {restaurant.ai_reasons[0]}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {restaurant.average_rating && (
                          <Badge variant="secondary" className="text-xs">
                            ⭐ {restaurant.average_rating}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(restaurant.id)}
                          className="p-1 h-auto"
                        >
                          <span className={isFavorite(restaurant.id) ? "text-red-500" : "text-muted-foreground"}>
                            ♥
                          </span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAssistantModal;