import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, MicOff, Volume2, VolumeX, Brain, ChefHat, User as UserIcon, Send, Keyboard, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import ThinkingIndicator from '@/components/ThinkingIndicator';
import TypewriterRichText from '@/components/TypewriterRichText';
import RichTextRenderer from '@/components/RichTextRenderer';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  isProcessing?: boolean;
  isTyping?: boolean;
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
  const [isThinking, setIsThinking] = useState(false);
  const [shouldStopTyping, setShouldStopTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [textInput, setTextInput] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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

  // Start continuous conversation mode
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
      
      voiceDetectionRef.current = setupVoiceActivityDetection(audioStream);
      
      setTimeout(() => {
        console.log('🎤 Auto-starting recording...');
        startRecording();
      }, 1000);
      
      toast({
        title: "Conversation démarrée",
        description: "Vous pouvez maintenant parler naturellement avec Cuizly",
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
    
    toast({
      title: "Conversation terminée",
      description: "La conversation vocale a été arrêtée",
    });
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

      if (transcriptionResponse.error) throw new Error('Transcription failed');
      
      const transcription = transcriptionResponse.data?.text;
      if (!transcription) throw new Error('No transcription received');

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
          conversationHistory: messages.slice(-5)
        }
      });

      if (chatResponse.error) throw new Error('AI processing failed');

      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) throw new Error('No AI response received');

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
      toast({
        title: t('voiceChat.errors.voiceProcessing.title'),
        description: t('voiceChat.errors.voiceProcessing.description'),
        variant: "destructive",
      });
      
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
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: 'user',
      content: text,
      timestamp: new Date(),
      isAudio: false
    }]);

    try {
      // Show thinking indicator
      setIsThinking(true);

      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: text,
          userId,
          conversationHistory: messages.slice(-5)
        }
      });

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      if (chatResponse.error) throw new Error('AI processing failed');

      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) throw new Error('No AI response received');

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

    } catch (error) {
      if (controller.signal.aborted) {
        console.log('Request was aborted by user');
        return;
      }
      
      console.error('Erreur traitement texte:', error);
      setIsThinking(false);
      toast({
        title: "Erreur de traitement",
        description: "Une erreur s'est produite lors du traitement de votre message.",
        variant: "destructive",
      });
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
    
    toast({
      title: "Génération arrêtée",
      description: "La génération de la réponse a été interrompue.",
    });
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

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 min-h-[calc(100vh-280px)]">
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
              {/* Logo normal pour le mode clair */}
              <img 
                src="/lovable-uploads/64c3c5b4-0bea-428d-8a44-3f25301da946.png" 
                alt="Cuizly Assistant Vocal"
                className="h-16 w-auto block dark:hidden"
              />
              {/* Logo éclairé pour le mode dark */}
              <img 
                src="/lovable-uploads/0f8fb1c9-af76-4fbc-8cec-9dc5fd10dc99.png" 
                alt="Cuizly Assistant Vocal"
                className="h-16 w-auto hidden dark:block brightness-125"
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
              <div className={`flex items-start gap-4 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                  {message.type === 'assistant' ? (
                    <AvatarFallback className="bg-background dark:bg-primary/20 text-foreground border border-border dark:border-primary/30">
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
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
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator when AI is processing */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-start gap-4 max-w-[85%]">
                <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                  <AvatarFallback className="bg-background dark:bg-primary/20 text-foreground border border-border dark:border-primary/30">
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
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

        <div className="border-t border-border bg-background px-6 py-6">
          <div className="flex justify-center mb-4">
            <div className="flex bg-muted rounded-full p-1">
              <Button
                variant={inputMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('voice')}
                className="rounded-full px-4 flex items-center justify-center"
              >
                <Mic className="w-4 h-4 mr-1" />
                Vocal
              </Button>
              <Button
                variant={inputMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('text')}
                className="rounded-full px-4 flex items-center justify-center"
              >
                <Keyboard className="w-4 h-4 mr-1" />
                Texte
              </Button>
            </div>
          </div>

          {inputMode === 'voice' ? (
            <>
              <div className="flex items-center justify-center space-x-4">
                <div className="relative">
                  <Button
                    onClick={toggleConversation}
                    disabled={isProcessing}
                    className={`w-20 h-20 rounded-full transition-all duration-300 relative z-10 ${
                      isConversationActive
                        ? isRecording
                          ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/25'
                          : 'bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/25'
                        : isProcessing
                        ? 'bg-muted cursor-not-allowed'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="relative">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      </div>
                    ) : isConversationActive ? (
                      isRecording ? (
                        <div className="flex flex-col items-center">
                          <Mic className="w-6 h-6 text-white mb-1" />
                          <div className="text-xs text-white">REC</div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Mic className="w-6 h-6 text-white mb-1" />
                          <div className="text-xs text-white">ON</div>
                        </div>
                      )
                    ) : (
                      <Mic className="w-8 h-8 text-white transition-transform duration-200" />
                    )}
                  </Button>
                </div>

                {isConversationActive && (
                  <Button
                    onClick={toggleRecording}
                    disabled={isProcessing}
                    variant="outline"
                    className={`w-12 h-12 rounded-full transition-all duration-300 ${
                      isRecording 
                        ? 'border-red-500 text-red-500 hover:bg-red-50' 
                        : 'border-green-500 text-green-500 hover:bg-green-50'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {!isConversationActive 
                    ? "Appuyez pour démarrer une conversation vocale"
                    : isRecording 
                    ? "🎤 Je vous écoute..."
                    : isProcessing 
                    ? "🧠 Traitement en cours..."
                    : isSpeaking
                    ? "🗣️ Cuizly vous répond..."
                    : ""
                  }
                </p>
                {isConversationActive && isRecording && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Parlez maintenant, ou utilisez le petit bouton pour arrêter l'écoute
                  </p>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message à Cuizly..."
                  disabled={isProcessing}
                  className="flex-1 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type={(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? "button" : "submit"}
                  onClick={(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? stopGeneration : undefined}
                  disabled={!(isProcessing || isThinking || isSpeaking || hasTypingMessage) && !textInput.trim()}
                  className="rounded-full w-12 h-12 p-0"
                >
                  {(isProcessing || isThinking || isSpeaking || hasTypingMessage) ? (
                    <Square className="w-5 h-5 fill-white dark:fill-black" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="text-center space-y-1 px-4 mx-auto max-w-xs sm:max-w-none">
                <p className="text-foreground font-medium text-sm sm:text-base leading-tight">
                  {isProcessing ? 'Traitement en cours...' : ''}
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default VoiceChatInterface;