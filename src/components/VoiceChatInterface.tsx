import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Volume2, VolumeX, Zap, Brain, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import cuizlyLogo from '@/assets/cuizly-logo.png';
import { useTranslation } from 'react-i18next';

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
  const [micEnabled, setMicEnabled] = useState(false); // Nouveau état pour le toggle du micro
  const [isListening, setIsListening] = useState(false); // Détection de la voix
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vadCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Voice Activity Detection (VAD)
  const setupVoiceDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      startVoiceActivityDetection();
    } catch (error) {
      console.error('Erreur configuration détection vocale:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  };

  const startVoiceActivityDetection = () => {
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculer le niveau audio moyen
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const threshold = 20; // Seuil de détection de la voix
      
      if (average > threshold && !isRecording && !isProcessing) {
        // Voix détectée - démarrer l'enregistrement
        setIsListening(true);
        startAutoRecording();
      } else if (average <= threshold && isRecording) {
        // Silence détecté - programmer l'arrêt
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (isRecording) {
              stopAutoRecording();
            }
          }, 1500); // Arrêter après 1.5 secondes de silence
        }
      } else if (average > threshold && silenceTimeoutRef.current) {
        // Annuler l'arrêt si la voix reprend
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };

    vadCheckIntervalRef.current = setInterval(checkAudioLevel, 100);
  };

  const startAutoRecording = async () => {
    if (!streamRef.current || isRecording) return;
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        setIsListening(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Annuler tout timeout de silence en cours
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Erreur enregistrement auto:', error);
    }
  };

  const stopAutoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const toggleMic = async () => {
    if (micEnabled) {
      // Désactiver le micro
      setMicEnabled(false);
      setIsListening(false);
      
      // Arrêter l'enregistrement en cours
      if (isRecording) {
        stopAutoRecording();
      }
      
      // Nettoyer la détection vocale
      if (vadCheckIntervalRef.current) {
        clearInterval(vadCheckIntervalRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // Fermer le stream audio
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Fermer le contexte audio
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      toast({
        title: "Micro désactivé",
        description: "Cliquez pour réactiver la détection vocale",
      });
    } else {
      // Activer le micro
      setMicEnabled(true);
      await setupVoiceDetection();
      
      toast({
        title: "Micro activé",
        description: "Parlez naturellement, je vous écoute",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vadCheckIntervalRef.current) {
        clearInterval(vadCheckIntervalRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
    // Cette fonction est maintenant remplacée par toggleMic
    // Gardée pour compatibilité mais redirige vers toggleMic
    toggleMic();
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
          {(isProcessing || isSpeaking) && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-2 text-sm">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="w-4 h-4 animate-pulse text-blue-600" />
                    <span>Traitement...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Volume2 className="w-4 h-4 animate-pulse text-green-600" />
                    <span>Parle...</span>
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
                  {t('voiceChat.mainTitle')}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {t('voiceChat.description')}
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
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Animation circles pour l'état micro activé */}
              {micEnabled && (
                <>
                  <div className={`absolute inset-0 rounded-full ${
                    isListening ? 'bg-green-500/20 animate-ping' : 'bg-blue-500/20 animate-pulse'
                  }`} />
                  <div className={`absolute inset-0 rounded-full ${
                    isListening ? 'bg-green-500/30 animate-pulse' : 'bg-blue-500/30'
                  }`} style={{ animationDelay: '0.5s' }} />
                </>
              )}
              
              {/* Animation pour l'enregistrement actif */}
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </>
              )}
              
              <Button
                onClick={toggleMic}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full transition-all duration-300 relative z-10 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/25'
                    : micEnabled
                    ? isListening
                      ? 'bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/25'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                    : isProcessing
                    ? 'bg-muted cursor-not-allowed'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-lg shadow-gray-500/25 hover:shadow-xl hover:shadow-gray-500/30 hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <div className="relative">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-foreground border-t-transparent" />
                  </div>
                ) : micEnabled ? (
                  <Mic className={`w-8 h-8 text-white transition-transform duration-200 ${
                    isListening || isRecording ? 'animate-pulse' : ''
                  }`} />
                ) : (
                  <MicOff className="w-8 h-8 text-white" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-4 space-y-1">
            {isRecording ? (
              <p className="text-red-600 font-medium">{t('voiceChat.recording')}</p>
            ) : isProcessing ? (
              <p className="text-primary font-medium">{t('voiceChat.processing')}</p>
            ) : micEnabled ? (
              isListening ? (
                <div className="space-y-1">
                  <p className="text-green-600 font-medium">🎤 En écoute...</p>
                  <p className="text-sm text-muted-foreground">Parlez naturellement</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-blue-600 font-medium">🎤 Micro activé</p>
                  <p className="text-sm text-muted-foreground">Parlez naturellement, je vous écoute</p>
                </div>
              )
            ) : (
              <div className="space-y-1">
                <p className="text-foreground font-medium">Cliquez pour activer le micro</p>
                <p className="text-sm text-muted-foreground">
                  Mode conversation continue comme ChatGPT
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