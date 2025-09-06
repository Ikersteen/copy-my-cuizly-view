import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { X, Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';
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
  
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Messages et résultats
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Initialiser le microphone
  const initializeMicrophone = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
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
      
      console.log('Microphone access granted');
      return stream;
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast({
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone. Veuillez autoriser l'accès.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Commencer l'enregistrement
  const startRecording = useCallback(async () => {
    try {
      const stream = streamRef.current || await initializeMicrophone();
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
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
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: "Impossible de démarrer l'enregistrement audio.",
        variant: "destructive"
      });
    }
  }, [initializeMicrophone, updateAudioLevel, toast]);

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      console.log('Recording stopped');
    }
  }, [isRecording]);

  // Traiter l'audio avec la nouvelle fonction ElevenLabs
  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      // Convertir l'audio en base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Préparer le contexte utilisateur
      const userAddress = getPrimaryAddressByType('user_delivery');
      const userContext = {
        preferences: preferences,
        address: userAddress?.formatted_address || 'Montréal',
        favorites: favorites // favorites are already strings (restaurant IDs)
      };

      console.log('Processing audio with ElevenLabs...', { userContext });

      // Appeler la fonction ElevenLabs
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

      // Ajouter les messages à la conversation
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

      // Jouer la réponse audio si non muté
      if (!isMuted && data.audioContent) {
        await playAudioResponse(data.audioContent);
      }

      console.log('Voice processing completed successfully');

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

  // Jouer la réponse audio
  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      
      // Convertir base64 en ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Créer un blob audio et le jouer
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

  // Nettoyage à la fermeture
  useEffect(() => {
    if (!open) {
      // Arrêter l'enregistrement si en cours
      if (isRecording) {
        stopRecording();
      }
      
      // Nettoyer les ressources
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
      
      // Reset state
      setMessages([]);
      setCurrentTranscript('');
      setRecommendations([]);
      setIsProcessing(false);
      setIsSpeaking(false);
      setAudioLevel(0);
    }
  }, [open, isRecording, stopRecording]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Section principale */}
          <div className="flex-1 flex flex-col">
            {/* État de connexion et animation */}
            <div className="flex-shrink-0 flex flex-col items-center p-6 bg-muted/50 rounded-lg mb-4">
              <div className="mb-4">
                <VoiceWaveAnimation 
                  isActive={isRecording || isSpeaking}
                  audioLevel={audioLevel}
                />
              </div>
              
              <div className="text-center mb-4">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span>Traitement en cours...</span>
                  </div>
                )}
                {isRecording && !isProcessing && (
                  <p className="text-primary font-medium">🎤 À l'écoute...</p>
                )}
                {isSpeaking && (
                  <p className="text-primary font-medium">🔊 Réponse en cours...</p>
                )}
                {!isRecording && !isProcessing && !isSpeaking && (
                  <p className="text-muted-foreground">Appuyez sur le microphone pour parler</p>
                )}
              </div>

              {/* Contrôles */}
              <div className="flex gap-2">
                <Button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className={cn(
                    "transition-all duration-200",
                    isRecording && "animate-pulse"
                  )}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isRecording ? "Arrêter" : "Parler"}
                </Button>
                
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="lg"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Messages de conversation */}
            {messages.length > 0 && (
              <div className="flex-1 overflow-y-auto">
                <h3 className="font-semibold mb-3">Conversation récente</h3>
                <div className="space-y-3">
                  {messages.slice(-6).map((message) => (
                    <Card key={message.id} className={cn(
                      "p-3",
                      message.type === 'user' ? "bg-primary/10 ml-8" : "bg-muted mr-8"
                    )}>
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "text-xs px-2 py-1 rounded-full flex-shrink-0",
                          message.type === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}>
                          {message.type === 'user' ? 'Vous' : 'Cuizly'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section recommandations */}
          {recommendations.length > 0 && (
            <div className="w-80 flex-shrink-0 overflow-y-auto">
              <h3 className="font-semibold mb-3">Recommandations</h3>
              <div className="space-y-3">
                {recommendations.map((restaurant) => (
                  <Card key={restaurant.id} className="p-3">
                    <CardContent className="p-0">
                      <h4 className="font-medium mb-1">{restaurant.name}</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {restaurant.cuisine_type.map((cuisine, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cuisine}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="text-xs">
                          {restaurant.price_range}
                        </Badge>
                      </div>
                      {restaurant.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {restaurant.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Score: {Math.round(restaurant.ai_score * 100)}%
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToFavorites(restaurant.id)}
                          disabled={isFavorite(restaurant.id)}
                        >
                          {isFavorite(restaurant.id) ? "Favoris ✓" : "Ajouter"}
                        </Button>
                      </div>
                      {restaurant.ai_reasons && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {restaurant.ai_reasons.slice(0, 2).map((reason, index) => (
                            <div key={index}>• {reason}</div>
                          ))}
                        </div>
                      )}
                    </CardContent>
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