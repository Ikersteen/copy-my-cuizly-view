import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, MicOff, Volume2, VolumeX, Brain, ChefHat, User as UserIcon, Send, Keyboard, Square, ArrowDown, Plus, Image as ImageIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import ThinkingIndicator from '@/components/ThinkingIndicator';
import TypewriterRichText from '@/components/TypewriterRichText';
import RichTextRenderer from '@/components/RichTextRenderer';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { useConversations } from '@/hooks/useConversations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  isProcessing?: boolean;
  isTyping?: boolean;
  imageUrl?: string;
}

interface VoiceChatInterfaceProps {
  onClose?: () => void;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [shouldStopTyping, setShouldStopTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [textInput, setTextInput] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceDetectionRef = useRef<any>(null);
  const realtimeClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  
  const { createConversation, saveMessage, loadConversations, loadConversationMessages } = useConversations();

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setUserProfile(profile);
        
        // Charger la dernière conversation ou en créer une nouvelle
        const { data: existingConversations, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!error && existingConversations && existingConversations.length > 0) {
          // Charger la dernière conversation existante
          const lastConversation = existingConversations[0];
          setCurrentConversationId(lastConversation.id);
          // Ne plus charger l'historique des conversations
        }
      }
    };
    initUser();
  }, []);

  // Détection du scroll pour afficher/cacher l'indicateur
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      // Afficher l'indicateur seulement si:
      // 1. L'utilisateur n'est pas près du bas
      // 2. ET il y a un message en cours de génération (thinking, typing ou speaking)
      const hasActiveGeneration = isThinking || messages.some(msg => msg.isTyping) || isSpeaking;
      setShowScrollIndicator(!isNearBottom && hasActiveGeneration);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, isThinking, isSpeaking]);

  // Scroll vers le bas seulement si l'utilisateur est déjà proche du bas
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    // Auto-scroll uniquement si l'utilisateur est près du bas
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle realtime voice messages
  const handleRealtimeMessage = (event: any) => {
    console.log('Realtime event:', event);
    
    switch (event.type) {
      case 'session.created':
        console.log('Session created');
        break;
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
      case 'response.audio.done':
        setIsSpeaking(false);
        // In conversation mode, restart recording after AI finishes
        if (isConversationActive && !isRecording) {
          setTimeout(() => {
            if (realtimeClientRef.current?.getConnectionStatus()) {
              setIsRecording(true);
            }
          }, 500);
        }
        break;
      case 'response.audio_transcript.delta':
        // Handle assistant transcript
        if (event.delta) {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isTyping) {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + event.delta,
                }
              ];
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  content: event.delta,
                  type: 'assistant',
                  timestamp: new Date(),
                  isAudio: true,
                  isProcessing: false,
                  isTyping: true,
                }
              ];
            }
          });
        }
        break;
      case 'response.audio_transcript.done':
        // Mark transcript as complete
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isTyping) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                isTyping: false,
              }
            ];
          }
          return prev;
        });
        break;
      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        // Stop AI audio if playing
        if (isSpeaking && audioRef.current) {
          audioRef.current.pause();
          setIsSpeaking(false);
        }
        break;
      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        break;
    }
  };

  // Voice Activity Detection for interruption
  const setupVoiceActivityDetection = (audioStream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let silenceTimeout: NodeJS.Timeout | null = null;
    let isSpeakingDetected = false;
    
    const detectVoiceActivity = () => {
      if (!isConversationActive) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const threshold = 15;
      
      if (average > threshold) {
        if (!isSpeakingDetected) {
          isSpeakingDetected = true;
          if (isSpeaking && audioRef.current) {
            console.log('User started speaking - interrupting AI');
            audioRef.current.pause();
            setIsSpeaking(false);
          }
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
        }
      } else {
        if (isSpeakingDetected) {
          if (silenceTimeout) clearTimeout(silenceTimeout);
          silenceTimeout = setTimeout(() => {
            isSpeakingDetected = false;
            console.log('User stopped speaking');
          }, 1000);
        }
      }
      
      requestAnimationFrame(detectVoiceActivity);
    };
    
    detectVoiceActivity();
    
    return {
      stop: () => {
        if (silenceTimeout) clearTimeout(silenceTimeout);
        audioContext.close();
      }
    };
  };

  // Start continuous conversation mode with realtime
  const startConversation = async () => {
    try {
      setIsConversationActive(true);
      setIsRecording(true);
      console.log('Starting realtime conversation...');
      
      // Initialize realtime voice client
      realtimeClientRef.current = new RealtimeVoiceClient(handleRealtimeMessage);
      await realtimeClientRef.current.connect();
      
      // Le système attend silencieusement que l'utilisateur parle
      
      console.log('Conversation démarrée - Vous pouvez maintenant parler naturellement avec Cuizly en temps réel');
    } catch (error) {
      console.error('Error starting realtime conversation:', error);
      setIsConversationActive(false);
      setIsRecording(false);
    }
  };

  // Stop conversation mode
  const stopConversation = () => {
    setIsConversationActive(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    
    // Disconnect realtime client
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    
    // Clean up old voice activity detection if exists
    if (voiceDetectionRef.current) {
      voiceDetectionRef.current.stop();
      voiceDetectionRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    
    console.log('Realtime conversation stopped');
  };

  // Audio recording functions
  const startRecording = async () => {
    if (!isConversationActive || !stream) return;
    
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Erreur enregistrement:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process voice input
  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    const userMessageId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: 'user',
      content: t('voiceChat.processingAudio'),
      timestamp: new Date(),
      isAudio: true,
      isProcessing: true
    }]);

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      
      const transcriptionResponse = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64.split(',')[1] }
      });

      if (transcriptionResponse.error) throw new Error(t('voiceAssistant.transcriptionFailed'));
      
      const transcription = transcriptionResponse.data?.text;
      if (!transcription) throw new Error(t('voiceAssistant.noTranscription'));

      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId 
          ? { ...msg, content: transcription, isProcessing: false }
          : msg
      ));

      // Show thinking indicator
      setIsThinking(true);

      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: transcription,
          userId,
          conversationHistory: messages.slice(-5),
          language: i18n.language === 'en' ? 'en' : 'fr'
        }
      });

      if (chatResponse.error) throw new Error(t('voiceAssistant.aiProcessingFailed'));

      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) throw new Error(t('voiceAssistant.noAiResponse'));

      // Hide thinking indicator and show response with typing effect
      setIsThinking(false);
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        isTyping: true
      }]);

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
      setIsThinking(false);
      
      setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
    } finally {
      setIsProcessing(false);
    }
  };

  // Process text input
  const processTextInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      type: 'user' as const,
      content: text,
      timestamp: new Date(),
      isAudio: false
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // If realtime client is connected, send via realtime
      if (realtimeClientRef.current?.getConnectionStatus()) {
        await realtimeClientRef.current.sendMessage(text);
        setIsProcessing(false);
        return;
      }

      // Fallback to regular chat function for text mode
      setIsThinking(true);

      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: text,
          userId,
          conversationHistory: messages.slice(-5),
          language: i18n.language === 'en' ? 'en' : 'fr'
        }
      });

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      if (chatResponse.error) throw new Error(t('voiceAssistant.aiProcessingFailed'));

      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) throw new Error(t('voiceAssistant.noAiResponse'));

      // Hide thinking indicator and show response with typing effect
      setIsThinking(false);
      const aiMessageId = (Date.now() + 1).toString();
      const assistantMessage = {
        id: aiMessageId,
        type: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      if (controller.signal.aborted) {
        console.log('Request was aborted by user');
        return;
      }
      
      console.error('Erreur traitement texte:', error);
      setIsThinking(false);
    } finally {
      setIsProcessing(false);
      setAbortController(null);
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
    
    audio.onplay = () => {
      console.log('AI started speaking');
      setIsSpeaking(true);
    };
    
    audio.onended = () => {
      console.log('AI finished speaking');
      setIsSpeaking(false);
      if (isConversationActive && !isRecording) {
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    };
    
    audio.onerror = () => {
      setIsSpeaking(false);
      console.error('Erreur de lecture audio');
    };
    
    audio.play();
  };

  const toggleConversation = () => {
    if (isConversationActive) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const toggleRecording = () => {
    if (!isConversationActive) return;
    
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

  const stopGeneration = () => {
    // Stop abort controller
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // Signal typewriter to stop
    setShouldStopTyping(true);
    
    // Stop all states immediately
    setIsProcessing(false);
    setIsThinking(false);
    setIsSpeaking(false);
    
    // Stop audio immediately if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Clear audio URL to stop any pending audio
    setAudioUrl(null);
    
    console.log('Génération arrêtée - La génération de la réponse a été interrompue.');
  };

  const handleTypewriterStop = (partialText: string, messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: partialText, isTyping: false }
        : msg
    ));
    setShouldStopTyping(false); // Reset the stop signal
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      processTextInput(textInput);
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  // Check if any message is currently typing
  const hasTypingMessage = messages.some(msg => msg.isTyping);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageUpload called');
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Reset input to allow selecting the same file again
    e.target.value = '';

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('errors.title'),
        description: t('errors.invalidFileType') || 'Veuillez sélectionner une image',
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      
      reader.onerror = () => {
        toast({
          title: t('errors.title'),
          description: t('errors.fileReadError') || 'Erreur lors de la lecture du fichier',
          variant: "destructive",
        });
        setIsProcessing(false);
      };
      
      reader.onload = async (event) => {
        try {
          const imageBase64 = event.target?.result as string;
          
          // Add user message with image
          const userMessageId = Date.now().toString();
          const userMessage: Message = {
            id: userMessageId,
            type: 'user',
            content: t('voiceChat.analyzingImage') || '📸 Analyse de l\'image...',
            timestamp: new Date(),
            isAudio: false,
            imageUrl: imageBase64
          };
          
          setMessages(prev => [...prev, userMessage]);
          setIsThinking(true);

          try {
            // Call edge function to analyze the image
            const response = await supabase.functions.invoke('analyze-food-image', {
              body: { 
                imageBase64,
                language: i18n.language === 'en' ? 'en' : 'fr'
              }
            });

            if (response.error) throw new Error(response.error.message);

            const analysis = response.data?.analysis;
            if (!analysis) throw new Error('No analysis received');

            setIsThinking(false);
            
            // Add AI response
            const aiMessageId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
              id: aiMessageId,
              type: 'assistant',
              content: analysis,
              timestamp: new Date(),
              isTyping: true
            }]);

          } catch (error) {
            console.error('Error analyzing image:', error);
            setIsThinking(false);
            toast({
              title: t('errors.title'),
              description: t('errors.imageAnalysisFailed') || 'Erreur lors de l\'analyse de l\'image',
              variant: "destructive",
            });
            // Remove user message on error
            setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
          } finally {
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Error in reader.onload:', error);
          setIsProcessing(false);
          toast({
            title: t('errors.title'),
            description: t('errors.fileReadError') || 'Erreur lors de la lecture du fichier',
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsProcessing(false);
      toast({
        title: t('errors.title'),
        description: t('errors.fileReadError') || 'Erreur lors de la lecture du fichier',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full min-h-0 relative">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 space-y-6"
        >
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
              <img 
                src="/lovable-uploads/cuizly-assistant-logo.png" 
                alt="Cuizly Assistant Vocal"
                className="h-16 w-auto"
              />
              <div className="space-y-3 max-w-lg">
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
              <div className={`max-w-[85%]`}>
                <div className={`rounded-3xl px-6 py-4 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                } ${message.isProcessing ? 'animate-pulse' : ''}`}>
                  {message.isTyping && message.type === 'assistant' ? (
                    <TypewriterRichText 
                      text={message.content}
                      speed={20}
                      className="text-base leading-relaxed"
                      shouldStop={shouldStopTyping}
                      onComplete={() => {
                        setMessages(prev => prev.map(msg => 
                          msg.id === message.id 
                            ? { ...msg, isTyping: false }
                            : msg
                        ));
                      }}
                      onStopped={(partialText) => handleTypewriterStop(partialText, message.id)}
                    />
                  ) : (
                    <RichTextRenderer 
                      content={message.content} 
                      className="text-base leading-relaxed"
                    />
                  )}
                  {message.isAudio && (
                    <div className="flex items-center gap-2 text-xs mt-2 opacity-70">
                      <Volume2 className="w-3 h-3" />
                      <span>{t('voiceChat.voiceMessage')}</span>
                    </div>
                  )}
                  {message.isProcessing && (
                    <div className="flex items-center gap-2 text-xs mt-2 opacity-70">
                      <ThinkingIndicator />
                    </div>
                  )}
                  {message.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden max-w-sm">
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded food" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator when AI is processing */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="rounded-3xl px-6 py-4 bg-muted text-foreground">
                  <ThinkingIndicator className="py-2" />
                </div>
              </div>
            </div>
          )}
          
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
        
        {/* Indicateur de scroll pour descendre */}
        {showScrollIndicator && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
            <Button
              onClick={scrollToBottom}
              variant="secondary"
              size="sm"
              className="rounded-full shadow-lg border border-border bg-background hover:bg-muted"
            >
              <ArrowDown className="w-4 h-4 mr-2 animate-bounce" />
              {t('voiceChat.newResponse') || 'Nouvelle réponse'}
            </Button>
          </div>
        )}

        <div className="flex-shrink-0 border-t border-border bg-background px-6 py-6">
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div className="flex gap-3">
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Dropdown menu for image upload options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    disabled={isProcessing}
                    variant="outline"
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => {
                    console.log('Camera option clicked');
                    cameraInputRef.current?.click();
                  }}>
                    <Camera className="mr-2 h-4 w-4" />
                    <span>{t('voiceChat.takePhoto') || 'Prendre une photo'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    console.log('Gallery option clicked');
                    fileInputRef.current?.click();
                  }}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>{t('voiceChat.choosePhoto') || 'Choisir une photo'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('voiceChat.inputPlaceholder')}
                disabled={isProcessing}
                autoComplete="on"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck="true"
                className="flex-1 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type={(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? "button" : "submit"}
                onClick={(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? stopGeneration : undefined}
                disabled={!(isProcessing || isThinking || isSpeaking || hasTypingMessage) && !textInput.trim()}
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
              >
                {(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? (
                  <Square className="w-3.5 h-3.5 fill-white dark:fill-black" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            <div className="text-center space-y-1 px-4 mx-auto max-w-xs sm:max-w-none">
              {/* Texte supprimé */}
            </div>
          </form>
        </div>
        
        {/* Disclaimer */}
        <div className="flex-shrink-0 px-6 py-2">
          <p className="text-center text-xs text-muted-foreground">
            {t('voiceChat.disclaimer')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default VoiceChatInterface;