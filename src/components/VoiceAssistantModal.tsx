import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { X, Mic, MicOff, Volume2, VolumeX, Send, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceWaveAnimation from './VoiceWaveAnimation';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Messages et résultats
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  
  // Refs pour l'audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio system
  useEffect(() => {
    if (!open) return;
    
    const initAudio = async () => {
      try {
        console.log("Audio system initialized");
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAudio();
  }, [open]);

  // Analyser pour le niveau audio
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255);
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Connect to voice service
  const connectToVoice = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    console.log("Starting voice assistant connection...");
    
    try {
      // Request microphone permission
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      // Setup audio context pour l'analyse
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      console.log("Microphone access granted");
      
      setIsConnected(true);
      setIsConnecting(false);
      
      toast({
        title: "Assistant vocal activé",
        description: "Bonjour ! Je suis votre assistant culinaire Cuizly. Comment puis-je vous aider ?",
      });
      
    } catch (error) {
      console.error('Failed to connect to voice service:', error);
      setIsConnecting(false);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au service vocal. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Disconnect from voice service
  const disconnectFromVoice = () => {
    console.log("Disconnecting from voice service...");
    
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Clean up audio resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await connectToVoice();
      return;
    }
    
    try {
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      updateAudioLevel();
      
      console.log("Audio recording started successfully");
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: "Impossible de démarrer l'enregistrement audio.",
        variant: "destructive"
      });
    }
  }, [updateAudioLevel, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      console.log("Stopping audio recording...");
    }
  }, [isRecording]);

  // Process audio with ElevenLabs
  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Prepare user context
      const userAddress = getPrimaryAddressByType('user_delivery');
      const userContext = {
        preferences: preferences,
        address: userAddress?.formatted_address || 'Montréal',
        favorites: favorites
      };

      console.log('Processing voice with ElevenLabs...');

      // Call ElevenLabs function
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        transcription: string;
        response: string;
        audioContent: string;
        error?: string;
      }>('cuizly-voice-elevenlabs', {
        body: {
          audio: base64Audio,
          userContext
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur de traitement vocal');
      }

      // Add messages to conversation
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: data.transcription,
        timestamp: new Date()
      };

      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setCurrentTranscript(data.transcription);

      // Play audio response if not muted
      if (!isMuted && data.audioContent) {
        await playAudioResponse(data.audioContent);
      }

    } catch (error) {
      console.error('Failed to process audio:', error);
      toast({
        title: "Erreur de traitement",
        description: "Impossible de traiter votre message vocal. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [preferences, favorites, getPrimaryAddressByType, isMuted, toast]);

  // Play audio response
  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Failed to play audio response:', error);
      setIsSpeaking(false);
    }
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Audio activé" : "Audio désactivé",
      description: isMuted ? "Vous entendrez maintenant les réponses vocales." : "Les réponses vocales sont désactivées.",
    });
  }, [isMuted, toast]);

  // Add to favorites
  const addToFavorites = useCallback(async (restaurantId: string) => {
    try {
      await toggleFavorite(restaurantId);
      toast({
        title: "Favori ajouté",
        description: "Le restaurant a été ajouté à vos favoris.",
      });
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le restaurant aux favoris.",
        variant: "destructive"
      });
    }
  }, [toggleFavorite, toast]);

  // Cleanup on modal close
  useEffect(() => {
    if (!open) {
      disconnectFromVoice();
      setMessages([]);
      setCurrentTranscript('');
      setRecommendations([]);
      setIsProcessing(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Assistant Vocal Cuizly</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Main Voice Interface */}
          <div className="flex-1 flex flex-col">
            {/* Connection Status */}
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-sm">
                    {isConnecting ? "Connexion..." : isConnected ? "Connecté" : "Déconnecté"}
                  </span>
                </div>
                {!isConnected && (
                  <Button onClick={connectToVoice} disabled={isConnecting} size="sm">
                    {isConnecting ? "Connexion..." : "Se connecter"}
                  </Button>
                )}
              </div>
            </div>

            {/* Voice Animation and Controls */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="mb-8">
                <VoiceWaveAnimation 
                  isActive={isRecording || isSpeaking}
                  audioLevel={audioLevel}
                />
              </div>

              {/* Status Text */}
              <div className="mb-6 text-center">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span>Traitement en cours...</span>
                  </div>
                )}
                {isRecording && !isProcessing && (
                  <p className="text-primary font-medium">🎤 À l'écoute... Parlez maintenant</p>
                )}
                {isSpeaking && (
                  <p className="text-primary font-medium">🔊 Réponse en cours...</p>
                )}
                {!isRecording && !isProcessing && !isSpeaking && isConnected && (
                  <p className="text-muted-foreground">Appuyez sur le microphone pour commencer</p>
                )}
                {!isConnected && (
                  <p className="text-muted-foreground">Connectez-vous pour utiliser l'assistant vocal</p>
                )}
              </div>

              {/* Current Transcript */}
              {currentTranscript && (
                <div className="mb-6 p-3 bg-primary/10 rounded-lg max-w-md text-center">
                  <p className="text-sm">{currentTranscript}</p>
                </div>
              )}

              {/* Voice Controls */}
              <div className="flex gap-4">
                <Button
                  onClick={toggleRecording}
                  disabled={!isConnected || isProcessing}
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className={cn(
                    "h-16 w-16 rounded-full",
                    isRecording && "animate-pulse"
                  )}
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="lg"
                  className="h-16 w-16 rounded-full"
                >
                  {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>

                {isConnected && (
                  <Button
                    onClick={disconnectFromVoice}
                    variant="outline"
                    size="lg"
                    className="h-16 w-16 rounded-full"
                  >
                    <StopCircle className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Messages and Recommendations */}
          <div className="w-80 flex flex-col overflow-hidden">
            {/* Recent Messages */}
            {messages.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Conversation récente</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {messages.slice(-4).map((message) => (
                    <Card key={message.id} className={cn(
                      "p-2 text-xs",
                      message.type === 'user' ? "bg-primary/10" : "bg-muted"
                    )}>
                      <div className="font-medium mb-1">
                        {message.type === 'user' ? '👤 Vous' : '🤖 Cuizly'}
                      </div>
                      <p className="line-clamp-2">{message.content}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold mb-3">Recommandations</h3>
                <div className="space-y-3 overflow-y-auto">
                  {recommendations.map((restaurant) => (
                    <Card key={restaurant.id} className="p-3">
                      <CardContent className="p-0">
                        <h4 className="font-medium mb-1 text-sm">{restaurant.name}</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {restaurant.cuisine_type.slice(0, 2).map((cuisine, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs">
                            {restaurant.price_range}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Score: {Math.round(restaurant.ai_score * 100)}%
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToFavorites(restaurant.id)}
                            disabled={isFavorite(restaurant.id)}
                            className="text-xs h-6"
                          >
                            {isFavorite(restaurant.id) ? "✓" : "+"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAssistantModal;