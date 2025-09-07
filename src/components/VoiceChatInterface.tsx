import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Mic, MicOff, Volume2, VolumeX, Zap, Brain, ChefHat, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import cuizlyLogo from '@/assets/cuizly-logo.png';
import { useTranslation } from 'react-i18next';
import { QuebecoisVoiceClient } from '@/utils/QuebecoisVoiceClient';

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
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // New state for natural conversation mode
  const [isNaturalMode, setIsNaturalMode] = useState(true); // Start in natural mode by default
  const [isConnected, setIsConnected] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeClientRef = useRef<QuebecoisVoiceClient | null>(null);

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
        
        // Auto-start natural conversation mode
        if (profile) {
          setTimeout(() => {
            startNaturalConversation();
          }, 500);
        }
      }
    };
    initUser();
  }, []);

  // Cleanup realtime client on unmount
  useEffect(() => {
    return () => {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect();
      }
    };
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
        title: t('voiceChat.errors.voiceProcessing.title'),
        description: t('voiceChat.errors.voiceProcessing.description'),
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
        title: t('voiceChat.errors.audioPlayback.title'),
        description: t('voiceChat.errors.audioPlayback.description'),
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

  // Natural conversation mode functions
  const startNaturalConversation = async () => {
    if (!userId) return;
    
    try {
      setIsProcessing(true);
      const client = new QuebecoisVoiceClient(
        (message) => handleRealtimeMessage(message),
        (speaking) => setIsSpeaking(speaking)
      );
      
      await client.init(userId);
      realtimeClientRef.current = client;
      setIsConnected(true);
      
      // Notification removed
    } catch (error) {
      console.error('Error starting quebecois conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'assistant québécois",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopNaturalConversation = () => {
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setCurrentTranscript('');
    
    toast({
      title: "🎙️ Mode Standard",
      description: "Conversation par clic activée",
      duration: 1500,
    });
  };

  const handleRealtimeMessage = (message: any) => {
    console.log('Realtime message:', message);
    
    if (message.type === 'transcript') {
      if (message.role === 'user') {
        setCurrentTranscript(message.text);
        // Add user message when transcript is complete
        if (message.text && message.text.trim()) {
          const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: message.text,
            timestamp: new Date(),
            isAudio: true
          };
          setMessages(prev => [...prev, userMessage]);
          setCurrentTranscript(''); // Clear after adding message
        }
      } else if (message.role === 'assistant') {
        // Update or create assistant message
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isProcessing) {
            return prev.map((msg, index) => 
              index === prev.length - 1 
                ? { ...msg, content: msg.content + message.text, isProcessing: false }
                : msg
            );
          } else {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: message.text,
              timestamp: new Date(),
              isProcessing: false
            };
            return [...prev, aiMessage];
          }
        });
      }
    } else if (message.type === 'user_speaking_started') {
      setCurrentTranscript('🎤 Écoute...');
    } else if (message.type === 'user_speaking_stopped') {
      // Keep transcript visible until we get the final transcription
    } else if (message.type === 'interruption') {
      // Afficher feedback d'interruption
      setCurrentTranscript('🚨 Interruption - Mode écoute');
      setTimeout(() => setCurrentTranscript(''), 1500);
    }
  };

  const toggleNaturalMode = async () => {
    if (isNaturalMode) {
      // Switching to normal mode
      if (isConnected) {
        stopNaturalConversation();
      }
      setIsNaturalMode(false);
    } else {
      // Switching to natural mode
      setIsNaturalMode(true);
      if (userId) {
        await startNaturalConversation();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Overlay pour afficher "Assistant Vocal" à côté du logo */}
      <div className="fixed top-0 left-0 z-[60] pointer-events-none">
        <div className="flex items-center h-20 px-6 sm:px-8">
            <div className="flex items-center gap-3 ml-[calc(120px+16px)]">
              <span className="text-lg font-medium text-blue-600 dark:text-blue-400">{t('voiceChat.title')}</span>
            </div>
        </div>
      </div>

      {/* Zone de conversation */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Messages Area - ajuster pour le header standard */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 min-h-[calc(100vh-200px)]">
          {/* Indicateurs AI intégrés dans la zone de messages */}
          {(isProcessing || isSpeaking || currentTranscript) && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-2 text-sm">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="w-4 h-4 animate-pulse text-blue-600" />
                    <span>🧠 Traitement ultra-rapide...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Volume2 className="w-4 h-4 animate-pulse text-green-600" />
                    <span>🗣️ Assistant répond...</span>
                  </div>
                )}
                {currentTranscript && (
                  <div className="flex items-center gap-2 text-primary">
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span className="text-primary font-medium">{currentTranscript}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-3 max-w-lg">
                <h1 className="text-2xl font-semibold text-foreground">
                  Assistant Vocal Cuizly
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Parlez naturellement pour trouver des restaurants, consulter vos préférences ou découvrir de nouvelles saveurs.
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
                    <AvatarFallback className="bg-background dark:bg-primary/20 text-foreground border border-border dark:border-primary/30">
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
                      <span>{t('voiceChat.voiceMessage')}</span>
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
                <span className="text-sm font-medium">{t('voiceChat.assistantSpeaking')}</span>
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
          {/* Mode toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-sm font-medium text-muted-foreground">
              Mode Normal
            </span>
            <Switch
              checked={isNaturalMode}
              onCheckedChange={toggleNaturalMode}
              disabled={isProcessing}
            />
            <span className="text-sm font-medium text-primary">
              Conversation Naturelle
            </span>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Animation circles pour l'enregistrement */}
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </>
              )}
              <Button
                onClick={isNaturalMode && isConnected ? stopNaturalConversation : toggleRecording}
                disabled={isProcessing && !isNaturalMode}
                className={`w-16 h-16 rounded-full transition-all duration-300 relative z-10 ${
                  isNaturalMode && isConnected
                    ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/25'
                    : isRecording 
                    ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/25' 
                    : isProcessing
                    ? 'bg-muted cursor-not-allowed'
                    : isNaturalMode && !isConnected
                    ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
                }`}
              >
                {isNaturalMode && isConnected ? (
                  <PhoneOff className="w-8 h-8 text-white" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : isProcessing ? (
                  <div className="relative">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-foreground border-t-transparent" />
                  </div>
                ) : (
                  isNaturalMode ? (
                    <Phone className="w-8 h-8 text-white transition-transform duration-200" />
                  ) : (
                    <Mic className="w-8 h-8 text-white transition-transform duration-200" />
                  )
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-4 space-y-1">
            {isNaturalMode ? (
              isConnected ? (
                <div className="space-y-1">
                  <p className="text-green-600 font-medium">🎙️ Conversation Active - Mode Québécois</p>
                  <p className="text-sm text-muted-foreground">
                    Parle naturellement, je comprends français et anglais! 🇫🇷🇬🇧
                  </p>
                  {currentTranscript && (
                    <p className="text-xs text-blue-600 italic">
                      "{currentTranscript}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-primary font-medium">Mode Conversation Naturelle</p>
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour démarrer une conversation fluide
                  </p>
                </div>
              )
            ) : (
              isRecording ? (
                <p className="text-red-600 font-medium">{t('voiceChat.recording')}</p>
              ) : isProcessing ? (
                <p className="text-primary font-medium">{t('voiceChat.processing')}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-foreground font-medium">Cliquez pour parler</p>
                  <p className="text-sm text-muted-foreground">
                    Demandez des recommandations de restaurants ou posez vos questions culinaires
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoiceChatInterface;