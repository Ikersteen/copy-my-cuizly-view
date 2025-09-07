import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Volume2, VolumeX, Zap, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import cuizlyLogo from '@/assets/cuizly-logo.png';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  isProcessing?: boolean;
}

interface VoiceChatInterfaceProps {
  onClose?: () => void;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        // Get user profile for display
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setUserProfile(profile);
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Écoute en cours...",
        description: "Parlez maintenant, cliquez pour arrêter",
      });
    } catch (error) {
      console.error('Erreur microphone:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process voice input with hybrid AI system
  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    // Add user message (processing)
    const userMessageId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: 'user',
      content: 'Traitement de l\'audio...',
      timestamp: new Date(),
      isAudio: true,
      isProcessing: true
    }]);

    try {
      // Step 1: Speech-to-Text (Whisper)
      const audioBase64 = await blobToBase64(audioBlob);
      
      const transcriptionResponse = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64.split(',')[1] }
      });

      if (transcriptionResponse.error) throw new Error('Transcription failed');
      
      const transcription = transcriptionResponse.data?.text;
      if (!transcription) throw new Error('No transcription received');

      // Update user message with transcription
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId 
          ? { ...msg, content: transcription, isProcessing: false }
          : msg
      ));

      // Step 2: ChatGPT Processing (Brain)
      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: transcription,
          userId,
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        }
      });

      if (chatResponse.error) throw new Error('AI processing failed');

      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) throw new Error('No AI response received');

      // Add AI text response
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);

      // Step 3: Text-to-Speech (ElevenLabs)
      const ttsResponse = await supabase.functions.invoke('cuizly-voice-elevenlabs', {
        body: { text: aiResponse }
      });

      if (ttsResponse.data?.audioContent) {
        const audioUrl = `data:audio/mp3;base64,${ttsResponse.data.audioContent}`;
        setAudioUrl(audioUrl);
        playAudio(audioUrl);
      }

    } catch (error) {
      console.error('Erreur traitement vocal:', error);
      toast({
        title: "Erreur",
        description: "Problème lors du traitement vocal",
        variant: "destructive",
      });
      
      // Remove processing message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Erreur audio",
        description: "Impossible de lire la réponse vocale",
        variant: "destructive",
      });
    };
    
    audio.play();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Barre de statut AI pour la page voice chat */}
      <div className="sticky top-20 z-40 w-full bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="w-full px-6 sm:px-8">
          <div className="flex items-center justify-center h-12">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Assistant Vocal</span>
              
              {/* AI Status indicators */}
              <div className="flex items-center gap-3">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="w-4 h-4 animate-pulse text-blue-600" />
                    <span className="hidden sm:inline">Traitement...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Volume2 className="w-4 h-4 animate-pulse text-green-600" />
                    <span className="hidden sm:inline">Parle...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de conversation intégrée au dashboard */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Messages Area - ajuster pour le nouveau header */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 min-h-[calc(100vh-232px)]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3 max-w-lg">
                <h1 className="text-2xl font-semibold text-foreground">
                  Assistant Vocal Cuizly
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Parlez naturellement pour trouver des restaurants, consulter vos préférences 
                  ou découvrir de nouvelles saveurs.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-4 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                  {message.type === 'assistant' ? (
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {userProfile?.chef_emoji_color || '🧑‍🍳'}
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userProfile?.first_name?.charAt(0) || userProfile?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className={`rounded-3xl px-6 py-4 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                } ${message.isProcessing ? 'animate-pulse' : ''}`}>
                  <p className="text-base leading-relaxed">{message.content}</p>
                  {message.isAudio && (
                    <div className="flex items-center gap-2 text-xs mt-2 opacity-70">
                      <Volume2 className="w-3 h-3" />
                      <span>Message vocal</span>
                    </div>
                  )}
                  {message.isProcessing && (
                    <div className="flex items-center gap-2 text-xs mt-2 opacity-70">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isSpeaking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 bg-green-50 text-green-700 rounded-3xl px-6 py-4">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Assistant vocal en cours...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopAudio}
                  className="text-green-700 hover:bg-green-100"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Zone d'entrée vocale */}
        <div className="border-t border-border bg-background px-6 py-6">
          <div className="flex items-center justify-center">
            <Button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : isProcessing
                  ? 'bg-muted cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-primary-foreground" />
              )}
            </Button>
          </div>
          
          <div className="text-center mt-4 space-y-1">
            {isRecording ? (
              <p className="text-red-600 font-medium">🎙️ Écoute en cours... Cliquez pour arrêter</p>
            ) : isProcessing ? (
              <p className="text-primary font-medium">🧠 Traitement en cours...</p>
            ) : (
              <div className="space-y-1">
                <p className="text-foreground font-medium">Cliquez pour parler</p>
                <p className="text-sm text-muted-foreground">
                  Demandez des recommandations de restaurants ou posez vos questions culinaires
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoiceChatInterface;