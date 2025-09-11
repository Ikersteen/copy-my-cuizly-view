import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Volume2, VolumeX, Brain, ChefHat, User as UserIcon, Send, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';
import RealtimeVoiceInterface from '@/components/RealtimeVoiceInterface';

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
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceDetectionRef = useRef<any>(null);

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
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const threshold = 15; // Voice activity threshold
      
      if (average > threshold) {
        if (!isSpeakingDetected) {
          isSpeakingDetected = true;
          // User started speaking - interrupt AI if speaking
          if (isSpeaking && audioRef.current) {
            console.log('User started speaking - interrupting AI');
            audioRef.current.pause();
            setIsSpeaking(false);
          }
          // Clear silence timeout
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
        }
      } else {
        if (isSpeakingDetected) {
          // Start silence timeout
          if (silenceTimeout) clearTimeout(silenceTimeout);
          silenceTimeout = setTimeout(() => {
            isSpeakingDetected = false;
            console.log('User stopped speaking');
          }, 1000); // 1 second of silence
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

  // Start continuous conversation mode - real-time streaming
  const startConversation = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setStream(audioStream);
      setIsConversationActive(true);
      
      // Setup voice activity detection for real-time streaming
      voiceDetectionRef.current = setupVoiceActivityDetection(audioStream);
      
      // Start continuous recording immediately - real-time mode
      startContinuousRecording(audioStream);
      
      toast({
        title: "Conversation temps réel démarrée",
        description: "Parlez naturellement, Cuizly vous écoute en continu",
      });
    } catch (error) {
      console.error('Erreur microphone:', error);
      toast({
        title: t('voiceChat.microphoneError'),
        description: t('voiceChat.microphoneErrorDescription'),
        variant: "destructive",
      });
    }
  };

  // Stop conversation mode
  const stopConversation = () => {
    setIsConversationActive(false);
    setIsRecording(false);
    
    // Stop voice detection
    if (voiceDetectionRef.current) {
      voiceDetectionRef.current.stop();
      voiceDetectionRef.current = null;
    }
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop audio stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    
    toast({
      title: "Conversation terminée",
      description: "La conversation vocale a été arrêtée",
    });
  };

  // Continuous real-time recording
  const startContinuousRecording = async (audioStream: MediaStream) => {
    if (!audioStream) return;
    
    try {
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Real-time streaming with shorter intervals
      const recordingInterval = 2000; // 2 seconds chunks for real-time feel
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && isConversationActive) {
          console.log('🎤 Processing real-time audio chunk...');
          await processVoiceInput(event.data);
        }
      };

      // Start recording with time slices for continuous streaming
      mediaRecorder.start(recordingInterval);
      setIsRecording(true);
      
      console.log('🎤 Continuous real-time recording started');
      
    } catch (error) {
      console.error('Erreur enregistrement continu:', error);
    }
  };

  // Legacy recording function (keep for compatibility)
  const startRecording = async () => {
    if (!isConversationActive || !stream) return;
    startContinuousRecording(stream);
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
      content: t('voiceChat.processingAudio'),
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

      // Step 3: Text-to-Speech (ElevenLabs) - Always for voice mode
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
    
    audio.onplay = () => {
      console.log('AI started speaking');
      setIsSpeaking(true);
    };
    
    audio.onended = () => {
      console.log('AI finished speaking');
      setIsSpeaking(false);
      // In real-time mode, recording continues automatically (no need to restart)
      console.log('🎤 Continuous recording continues...');
    };
    
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

  // Process text input
  const processTextInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    // Add user message
    const userMessageId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: 'user',
      content: text,
      timestamp: new Date(),
      isAudio: false
    }]);

    try {
      // ChatGPT Processing (skip speech-to-text for text input)
      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: text,
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

      // Text-to-Speech (ElevenLabs) - only for voice mode
      if (inputMode === 'voice') {
        const ttsResponse = await supabase.functions.invoke('cuizly-voice-elevenlabs', {
          body: { text: aiResponse }
        });

        if (ttsResponse.data?.audioContent) {
          const audioUrl = `data:audio/mp3;base64,${ttsResponse.data.audioContent}`;
          setAudioUrl(audioUrl);
          playAudio(audioUrl);
        }
      }

    } catch (error) {
      console.error('Erreur traitement texte:', error);
      toast({
        title: "Erreur de traitement",
        description: "Une erreur s'est produite lors du traitement de votre message.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Tabs pour les différents modes vocaux */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="realtime">Temps Réel (ChatGPT Style)</TabsTrigger>
            <TabsTrigger value="classic">Mode Classique</TabsTrigger>
          </TabsList>
          
          <TabsContent value="realtime" className="mt-6">
            <div className="min-h-[calc(100vh-200px)]">
              <RealtimeVoiceInterface />
            </div>
          </TabsContent>
          
          <TabsContent value="classic" className="mt-6">
            <ClassicVoiceInterface 
              messages={messages}
              isRecording={isRecording}
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
              isConversationActive={isConversationActive}
              inputMode={inputMode}
              textInput={textInput}
              userProfile={userProfile}
              onToggleConversation={toggleConversation}
              onToggleRecording={toggleRecording}
              onStopAudio={stopAudio}
              onTextInputChange={setTextInput}
              onTextSubmit={handleTextSubmit}
              onKeyPress={handleKeyPress}
              onInputModeChange={setInputMode}
              messagesEndRef={messagesEndRef}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Composant pour l'interface classique
interface ClassicVoiceInterfaceProps {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isConversationActive: boolean;
  inputMode: 'voice' | 'text';
  textInput: string;
  userProfile: any;
  onToggleConversation: () => void;
  onToggleRecording: () => void;
  onStopAudio: () => void;
  onTextInputChange: (value: string) => void;
  onTextSubmit: (e: React.FormEvent) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onInputModeChange: (mode: 'voice' | 'text') => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ClassicVoiceInterface: React.FC<ClassicVoiceInterfaceProps> = ({
  messages,
  isRecording,
  isProcessing,
  isSpeaking,
  isConversationActive,
  inputMode,
  textInput,
  userProfile,
  onToggleConversation,
  onToggleRecording,
  onStopAudio,
  onTextInputChange,
  onTextSubmit,
  onKeyPress,
  onInputModeChange,
  messagesEndRef
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Messages Area - ajuster pour le header standard */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 min-h-[calc(100vh-200px)]">
        {/* Indicateurs AI intégrés dans la zone de messages */}
        {(isProcessing || isSpeaking) && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-2 text-sm">
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Brain className="w-4 h-4 animate-pulse text-blue-600" />
                  <span>{t('voiceChat.processingInProgress')}</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Volume2 className="w-4 h-4 animate-pulse text-green-600" />
                  <span>🗣️ Assistant répond...</span>
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
            className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src="/lovable-uploads/cuizly-icon-hd.png" alt="Cuizly" />
                <AvatarFallback>
                  <ChefHat className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-muted'
              }`}>
                {message.isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                    <span className="text-sm">{message.content}</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </div>
              
              <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-2 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {message.isAudio && (
                  <div className="flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    <span>Audio</span>
                  </div>
                )}
              </div>
            </div>
            
            {message.type === 'user' && (
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage 
                  src={userProfile?.avatar_url} 
                  alt={userProfile?.display_name || 'User'} 
                />
                <AvatarFallback>
                  <UserIcon className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de contrôles - interface fixe en bas */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        {/* Contrôles du mode vocal */}
        <div className="flex items-center justify-center gap-6 px-6 py-6">
          {/* Bouton principal de conversation */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={onToggleConversation}
              className={`w-16 h-16 rounded-full transition-all duration-300 ${
                isConversationActive
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
              disabled={isProcessing}
            >
              {isConversationActive ? (
                <Volume2 className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
            <span className="text-sm font-medium">
              {isConversationActive ? 'Conversation ON' : 'Démarrer'}
            </span>
          </div>

          {/* Bouton d'enregistrement manuel (si en mode conversation) */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={onToggleRecording}
              disabled={!isConversationActive || isProcessing}
              className={`w-14 h-14 rounded-full transition-all duration-300 ${
                isRecording && isConversationActive
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {isRecording && isConversationActive ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6 text-white transition-transform duration-200" />
              )}
            </Button>
          </div>

          {/* Bouton de contrôle manuel de l'enregistrement (visible uniquement en mode conversation) */}
          {isConversationActive && (
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={onStopAudio}
                disabled={!isSpeaking}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300"
              >
                {isSpeaking ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <span className="text-xs">
                {isSpeaking ? 'Arrêter' : 'Muet'}
              </span>
            </div>
          )}

          {/* Basculer entre mode vocal et texte */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => onInputModeChange(inputMode === 'voice' ? 'text' : 'voice')}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
            >
              {inputMode === 'voice' ? (
                <Keyboard className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            <span className="text-xs">
              {inputMode === 'voice' ? 'Texte' : 'Vocal'}
            </span>
          </div>
        </div>

        {/* Mode texte - formulaire de saisie */}
        {inputMode === 'text' && (
          <form onSubmit={onTextSubmit} className="px-6 pb-6">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  value={textInput}
                  onChange={(e) => onTextInputChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder={t('voiceChat.textInputPlaceholder')}
                  disabled={isProcessing}
                  className="resize-none min-h-[44px] py-3"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!textInput.trim() || isProcessing}
                className="px-4 py-3 h-[44px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Appuyez sur Entrée pour envoyer
            </p>
          </form>
        )}
      </div>
    </>
  );
};

export default VoiceChatInterface;