import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, MicOff, Volume2, VolumeX, Brain, ChefHat, User as UserIcon, Send, Keyboard, Square, ArrowDown, Plus, Image as ImageIcon, Camera, ThumbsUp, ThumbsDown, Copy, Bookmark, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import ThinkingIndicator from '@/components/ThinkingIndicator';
import TypewriterRichText from '@/components/TypewriterRichText';
import RichTextRenderer from '@/components/RichTextRenderer';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { useConversations } from '@/hooks/useConversations';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAnonymousTracking } from '@/hooks/useAnonymousTracking';
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
  documentUrl?: string;
  documentName?: string;
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
  const [selectedFiles, setSelectedFiles] = useState<Array<{id: string, type: 'image' | 'document', data: string, name: string}>>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceDetectionRef = useRef<any>(null);
  const realtimeClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const thinkingIndicatorRef = useRef<HTMLDivElement | null>(null);
  
  const { createConversation, saveMessage, loadConversations, loadConversationMessages } = useConversations();
  const { trackUserLocation } = useUserLocation();
  const [messageActions, setMessageActions] = useState<Record<string, { liked?: boolean; disliked?: boolean; copied?: boolean; bookmarked?: boolean }>>({});
  
  // Tracking de localisation pour utilisateurs anonymes
  useAnonymousTracking('Cuizly Assistant');

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setIsAnonymous(false);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setUserProfile(profile);
        
        // Suivre la localisation de l'utilisateur
        await trackUserLocation('Cuizly Assistant');
        
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
      } else {
        // Utilisateur non connecté = mode anonyme
        setIsAnonymous(true);
        setUserId(null);
        setUserProfile(null);
        
        // Charger les conversations anonymes existantes
        const anonymousSessionId = localStorage.getItem('cuizly_anonymous_session_id');
        if (anonymousSessionId) {
          const { data: existingConversations, error } = await supabase
            .from('conversations')
            .select('*')
            .is('user_id', null)
            .eq('anonymous_session_id', anonymousSessionId)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (!error && existingConversations && existingConversations.length > 0) {
            // Charger la dernière conversation anonyme existante
            const lastConversation = existingConversations[0];
            setCurrentConversationId(lastConversation.id);
            
            // Charger les messages de cette conversation
            const conversation = await loadConversationMessages(lastConversation.id);
            if (conversation?.messages) {
              const loadedMessages = conversation.messages.map(msg => ({
                id: msg.id,
                type: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at),
                isAudio: msg.message_type === 'audio'
              }));
              setMessages(loadedMessages);
            }
          }
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
    // Ne plus appeler handleScroll() automatiquement pour éviter le scroll automatique

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, isThinking, isSpeaking]);

  // Scroll automatique vers l'indicateur de réflexion
  useEffect(() => {
    if (isThinking && thinkingIndicatorRef.current) {
      thinkingIndicatorRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isThinking]);

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
        // Mark transcript as complete and save to database
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isTyping) {
            // Save assistant message to database
            if (currentConversationId && lastMessage.content) {
              saveMessage(currentConversationId, 'assistant', lastMessage.content, 'audio');
            }
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
      case 'conversation.item.input_audio_transcription.completed':
        // Sauvegarder le message vocal de l'utilisateur
        if (event.transcript && currentConversationId) {
          console.log('User transcript:', event.transcript);
          saveMessage(currentConversationId, 'user', event.transcript, 'audio');
          
          // Ajouter le message à l'interface
          setMessages(prev => {
            // Vérifier si le message n'existe pas déjà
            const lastUserMessage = prev.filter(m => m.type === 'user').pop();
            if (!lastUserMessage || lastUserMessage.content !== event.transcript) {
              return [...prev, {
                id: Date.now().toString(),
                type: 'user',
                content: event.transcript,
                timestamp: new Date(),
                isAudio: true
              }];
            }
            return prev;
          });
        }
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
      
      // Create conversation if needed
      let conversationId = currentConversationId;
      if (!conversationId && userId) {
        conversationId = await createConversation('voice');
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }
      
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
    
    // Create conversation if needed (even for anonymous users)
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createConversation('text');
      if (conversationId) {
        setCurrentConversationId(conversationId);
      }
    }
    
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      type: 'user' as const,
      content: text,
      timestamp: new Date(),
      isAudio: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database (even for anonymous users)
    if (conversationId) {
      await saveMessage(conversationId, 'user', text, 'text');
    }

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
      
      // Save assistant message to database
      if (conversationId) {
        await saveMessage(conversationId, 'assistant', aiResponse, 'text');
      }

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

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there are selected files, process them with the text message
    if (selectedFiles.length > 0) {
      const filesToProcess = [...selectedFiles];
      const messageToSend = textInput.trim();
      
      // Clear immediately
      setSelectedFiles([]);
      setTextInput('');
      
      // Then process
      await processFilesWithMessage(filesToProcess, messageToSend);
      return;
    }
    
    // Otherwise, process text normally
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
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  // Compress and resize image
  const compressImage = (base64: string, maxWidth = 512, maxHeight = 512, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });
  };

  // Handle file upload (images and documents) - just store the files, don't send yet
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input to allow selecting the same file again
    e.target.value = '';

    // Check if we already have 5 files
    if (selectedFiles.length >= 5) {
      toast({
        title: t('errors.title'),
        description: i18n.language === 'fr' ? 'Vous pouvez ajouter jusqu\'à 5 fichiers maximum' : 'You can add up to 5 files maximum',
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: t('errors.title'),
        description: t('errors.invalidFileType') || 'Veuillez sélectionner une image',
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;
        
        let processedData = fileData;
        // Compress images before storing
        if (fileType === 'image') {
          processedData = await compressImage(fileData);
        }
        
        const newFile = {
          id: Date.now().toString() + Math.random(),
          type: fileType,
          data: processedData,
          name: file.name
        };
        
        setSelectedFiles(prev => [...prev, newFile]);
      };
      reader.onerror = () => {
        toast({
          title: t('errors.title'),
          description: t('errors.fileReadError') || 'Erreur lors de la lecture du fichier',
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.fileReadError') || 'Erreur lors de la lecture du fichier',
        variant: "destructive",
      });
    }
  };

  // Process multiple files with optional text message
  const processFilesWithMessage = async (files: Array<{id: string, type: 'image' | 'document', data: string, name: string}>, message: string) => {
    setIsProcessing(true);
    
    // Create conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId && userId) {
      conversationId = await createConversation('text');
      if (conversationId) {
        setCurrentConversationId(conversationId);
      }
    }
    
    try {
      // Upload all files to Supabase Storage
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const base64Data = file.data.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        const bucketName = file.type === 'image' ? 'chat-images' : 'chat-documents';
        const mimeType = file.type === 'image' ? 'image/jpeg' : 'application/octet-stream';
        const blob = new Blob([byteArray], { type: mimeType });
        
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || (file.type === 'image' ? 'jpg' : 'pdf');
        const fileName = `${userId || 'anonymous'}_${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, blob);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }
      
      // Always create a message if files are uploaded
      const userMessageId = Date.now().toString();
      const imageFile = files.find(f => f.type === 'image');
      const documentFile = files.find(f => f.type === 'document');
      
      const userMessage: Message = {
        id: userMessageId,
        type: 'user',
        content: message.trim(), // Empty string if no text
        timestamp: new Date(),
        isAudio: false,
        imageUrl: imageFile?.data,
        documentUrl: documentFile ? uploadedUrls[files.indexOf(documentFile)] : undefined,
        documentName: documentFile?.name
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database with the file URLs
      if (conversationId) {
        await saveMessage(
          conversationId, 
          'user', 
          message.trim() || ' ', // Space if no text to indicate file only
          'text',
          undefined,
          undefined,
          uploadedUrls[0]
        );
      }
      
      // Clear selected files after sending
      setSelectedFiles([]);
    } catch (uploadError) {
      console.error('Error uploading files:', uploadError);
      toast({
        title: t('errors.title'),
        description: 'Erreur lors de l\'upload des fichiers',
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }
    
    // Analyze images or documents
    const imageFile = files.find(f => f.type === 'image');
    const documentFile = files.find(f => f.type === 'document');
    
    if (imageFile || documentFile) {
      setIsThinking(true);

      try {
        let response;
        
        if (imageFile) {
          // Call edge function to analyze the image
          response = await supabase.functions.invoke('analyze-food-image', {
            body: { 
              imageBase64: imageFile.data,
              userMessage: message,
              language: i18n.language === 'en' ? 'en' : 'fr'
            }
          });
        } else if (documentFile) {
          // Call edge function to analyze the document
          response = await supabase.functions.invoke('cuizly-voice-chat', {
            body: { 
              message: message || 'Analyse ce document',
              conversationHistory: messages.slice(-5).map(m => ({
                role: m.type === 'user' ? 'user' : 'assistant',
                content: m.content
              })),
              language: i18n.language === 'en' ? 'en' : 'fr',
              documentData: documentFile.data
            }
          });
        }

        if (response?.error) throw new Error(response.error.message);

        const analysis = response?.data?.response || response?.data?.analysis;
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
        
        // Save assistant message to database
        if (conversationId) {
          await saveMessage(conversationId, 'assistant', analysis, 'text');
        }

      } catch (error) {
        console.error('Error analyzing file:', error);
        setIsThinking(false);
        toast({
          title: t('errors.title'),
          description: imageFile 
            ? (t('errors.imageAnalysisFailed') || 'Erreur lors de l\'analyse de l\'image')
            : 'Erreur lors de l\'analyse du document',
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  };

  return (
    <>
      <main className="h-screen bg-background flex flex-col max-w-6xl mx-auto w-full relative overflow-hidden">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 pb-40 space-y-6"
          style={{ overflowAnchor: 'none' }}
        >
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
              <img 
                src="/cuizly-assistant-logo.png" 
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
                {message.imageUrl || message.documentUrl ? (
                  // If message has image or document, show it with optional text below
                  <div className="space-y-2">
                    {message.imageUrl && (
                      <div className="rounded-2xl overflow-hidden">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded food" 
                          className="max-w-xs max-h-48 object-cover"
                        />
                      </div>
                    )}
                    {message.documentUrl && (
                      <div className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-muted border border-border">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{message.documentName || 'Document'}</span>
                      </div>
                    )}
                    {message.content && (
                      <div className={message.type === 'user' ? 'rounded-3xl px-6 py-4 bg-muted w-fit' : ''}>
                        <RichTextRenderer 
                          content={message.content} 
                          className="text-base leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Otherwise show normal message bubble
                  <div className={`${
                    message.type === 'user' 
                      ? 'rounded-3xl px-6 py-4 bg-muted w-fit' 
                      : ''
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
                  </div>
                )}
                
                {/* Action icons below messages */}
                {!message.isProcessing && !message.isTyping && (
                  <div className="flex items-center gap-1 mt-2">
                    {message.type === 'user' ? (
                      // For user messages: only Copy icon
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-full transition-colors hover:bg-transparent"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          setMessageActions(prev => ({
                            ...prev,
                            [message.id]: { ...prev[message.id], copied: true }
                          }));
                          toast({
                            description: "Message copié",
                            duration: 2000,
                          });
                          
                          // Reset après 1 seconde
                          setTimeout(() => {
                            setMessageActions(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], copied: false }
                            }));
                          }, 1000);
                        }}
                      >
                        <Copy 
                          className={`w-3.5 h-3.5 transition-all ${
                            messageActions[message.id]?.copied 
                              ? 'fill-black dark:fill-white stroke-black dark:stroke-white' 
                              : 'fill-none stroke-muted-foreground'
                          }`} 
                        />
                      </Button>
                    ) : (
                      // For assistant messages: Like, Dislike, Copy, Bookmark icons
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full transition-colors hover:bg-transparent"
                          onClick={() => {
                            setMessageActions(prev => ({
                              ...prev,
                              [message.id]: { 
                                ...prev[message.id], 
                                liked: !prev[message.id]?.liked,
                                disliked: false
                              }
                            }));
                            toast({
                              description: "Merci pour votre feedback!",
                              duration: 2000,
                            });
                          }}
                        >
                          <ThumbsUp 
                            className={`w-3.5 h-3.5 transition-all ${
                              messageActions[message.id]?.liked 
                                ? 'fill-black dark:fill-white stroke-black dark:stroke-white' 
                                : 'fill-none stroke-muted-foreground'
                            }`} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full transition-colors hover:bg-transparent"
                          onClick={() => {
                            setMessageActions(prev => ({
                              ...prev,
                              [message.id]: { 
                                ...prev[message.id], 
                                disliked: !prev[message.id]?.disliked,
                                liked: false
                              }
                            }));
                            toast({
                              description: "Merci pour votre feedback!",
                              duration: 2000,
                            });
                          }}
                        >
                          <ThumbsDown 
                            className={`w-3.5 h-3.5 transition-all ${
                              messageActions[message.id]?.disliked 
                                ? 'fill-black dark:fill-white stroke-black dark:stroke-white' 
                                : 'fill-none stroke-muted-foreground'
                            }`} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full transition-colors hover:bg-transparent"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            setMessageActions(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], copied: true }
                            }));
                            toast({
                              description: "Réponse copiée",
                              duration: 2000,
                            });
                            
                            // Reset après 1 seconde
                            setTimeout(() => {
                              setMessageActions(prev => ({
                                ...prev,
                                [message.id]: { ...prev[message.id], copied: false }
                              }));
                            }, 1000);
                          }}
                        >
                          <Copy 
                            className={`w-3.5 h-3.5 transition-all ${
                              messageActions[message.id]?.copied 
                                ? 'fill-black dark:fill-white stroke-black dark:stroke-white' 
                                : 'fill-none stroke-muted-foreground'
                            }`} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full transition-colors hover:bg-transparent"
                          onClick={() => {
                            setMessageActions(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], bookmarked: !prev[message.id]?.bookmarked }
                            }));
                            toast({
                              description: "Réponse enregistrée",
                              duration: 2000,
                            });
                          }}
                        >
                          <Bookmark 
                            className={`w-3.5 h-3.5 transition-all ${
                              messageActions[message.id]?.bookmarked 
                                ? 'fill-black dark:fill-white stroke-black dark:stroke-white' 
                                : 'fill-none stroke-muted-foreground'
                            }`} 
                          />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator when AI is processing */}
          {isThinking && (
            <div ref={thinkingIndicatorRef} className="flex justify-start">
              <div className="max-w-[85%]">
                <div>
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
        </div>
        
          {/* Indicateur de scroll pour descendre */}
          {showScrollIndicator && (
            <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-[60]">
              <Button
                onClick={scrollToBottom}
                variant="secondary"
                size="icon"
                className="rounded-full shadow-lg border border-border bg-background hover:bg-muted"
              >
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </Button>
            </div>
          )}
        </main>

      {/* Chat input et disclaimer - complètement indépendant */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm px-6 py-4 z-50">
        <form onSubmit={handleTextSubmit} className="space-y-3 max-w-4xl mx-auto">
          {/* Files preview */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {selectedFiles.map((file) => (
                <div key={file.id} className="relative inline-block group">
                  {file.type === 'image' ? (
                    <div className="relative">
                      <img 
                        src={file.data} 
                        alt={file.name} 
                        className="h-24 w-auto max-w-[120px] rounded-xl border-2 border-border object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 bg-gray-700 hover:bg-gray-600 text-white shadow-lg flex items-center justify-center"
                        onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                      >
                        <span className="text-lg font-normal leading-none">×</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-muted min-w-[140px]">
                        <FileText className="w-5 h-5 flex-shrink-0 text-primary" />
                        <span className="text-sm truncate max-w-[100px]">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 bg-gray-700 hover:bg-gray-600 text-white shadow-lg flex items-center justify-center"
                        onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                      >
                        <span className="text-lg font-normal leading-none">×</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-3 items-center">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'image')}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'image')}
              className="hidden"
              capture="user"
            />
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
              onChange={(e) => handleFileUpload(e, 'document')}
              className="hidden"
            />
            
            {/* Dropdown menu for image upload options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  disabled={isProcessing}
                  variant="outline"
                  className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 transition-none hover:scale-100"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56 bg-popover border-2 shadow-lg rounded-xl p-2"
                sideOffset={8}
              >
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Camera option clicked');
                    cameraInputRef.current?.click();
                  }}
                  className="rounded-lg px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <Camera className="mr-3 h-5 w-5" />
                  <span className="font-medium">{t('voiceChat.takePhoto') || 'Prendre une photo'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Gallery option clicked');
                    fileInputRef.current?.click();
                  }}
                  className="rounded-lg px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <ImageIcon className="mr-3 h-5 w-5" />
                  <span className="font-medium">{t('voiceChat.choosePhoto') || 'Choisir une photo'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Document option clicked');
                    pdfInputRef.current?.click();
                  }}
                  className="rounded-lg px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <FileText className="mr-3 h-5 w-5" />
                  <span className="font-medium">{i18n.language === 'fr' ? 'Ajouter un document' : 'Add Document'}</span>
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
              disabled={!(isProcessing || isThinking || isSpeaking || hasTypingMessage) && !textInput.trim() && selectedFiles.length === 0}
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
            >
              {(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? (
                <Square className="w-3.5 h-3.5 fill-white dark:fill-black" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </form>
        
        {/* Disclaimer text */}
        <p className="text-center text-xs text-muted-foreground px-2 mt-3 max-w-4xl mx-auto">
          {i18n.language === 'fr' ? (
            <>
              En discutant avec Cuizly Assistant, vous acceptez nos{' '}
              <a href="/terms" className="underline hover:text-foreground transition-colors">conditions</a>
              {' '}et avez lu notre{' '}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">politique de confidentialité</a>
              . Voir les{' '}
              <a href="/cookies" className="underline hover:text-foreground transition-colors">préférences de cookies</a>.
            </>
          ) : (
            <>
              By chatting with Cuizly Assistant, you accept our{' '}
              <a href="/terms" className="underline hover:text-foreground transition-colors">terms</a>
              {' '}and have read our{' '}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">privacy policy</a>
              . See{' '}
              <a href="/cookies" className="underline hover:text-foreground transition-colors">cookie preferences</a>.
            </>
          )}
        </p>
      </div>
    </>
  );
};

export default VoiceChatInterface;