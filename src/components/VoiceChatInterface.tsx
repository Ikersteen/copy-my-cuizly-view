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
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [shouldStopTyping, setShouldStopTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeVoiceChatRef = useRef<RealtimeVoiceChat | null>(null);

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

  useEffect(() => {
    return () => {
      if (realtimeVoiceChatRef.current) {
        realtimeVoiceChatRef.current.disconnect();
      }
    };
  }, []);

  // Realtime conversation functions
  const startConversation = async () => {
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    try {
      realtimeVoiceChatRef.current = new RealtimeVoiceChat(
        (message) => {
          setCurrentMessage(message);
          console.log('User said:', message);
          
          // Add user message to history
          if (message.trim()) {
            const userMessageId = Date.now().toString();
            setMessages(prev => [...prev, {
              id: userMessageId,
              type: 'user',
              content: message,
              timestamp: new Date(),
              isAudio: true
            }]);
          }
        },
        (speaking) => {
          setIsSpeaking(speaking);
          console.log('AI speaking:', speaking);
        },
        (connected) => {
          setIsConversationActive(connected);
          console.log('Connection status:', connected);
        }
      );

      await realtimeVoiceChatRef.current.init(userId);
      
      toast({
        title: "Conversation démarrée",
        description: "Parlez naturellement - Cuizly vous écoute",
      });
    } catch (error) {
      console.error('Erreur conversation:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : 'Impossible de démarrer la conversation',
        variant: "destructive",
      });
    }
  };

  const stopConversation = () => {
    if (realtimeVoiceChatRef.current) {
      realtimeVoiceChatRef.current.disconnect();
      realtimeVoiceChatRef.current = null;
    }
    setIsConversationActive(false);
    setIsSpeaking(false);
    setCurrentMessage('');
    
    toast({
      title: "Conversation terminée",
      description: "La conversation vocale a été arrêtée",
    });
  };

  const toggleConversation = () => {
    if (isConversationActive) {
      stopConversation();
    } else {
      startConversation();
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
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t('voiceChat.title')}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'voice' | 'text')} className="flex-1 flex flex-col">
        <div className="border-b border-border px-6 py-2">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="voice" className="flex items-center justify-center gap-1">
              <Mic className="w-4 h-4 mr-1" />
              Vocal
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center justify-center gap-1">
              <Keyboard className="w-4 h-4 mr-1" />
              Texte
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <TabsContent value="voice" className="space-y-6">
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-foreground">{t('voiceChat.mainTitle')}</h2>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {t('voiceChat.description')}
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  {/* Single conversation button - blue when active, red when inactive */}
                  <Button
                    onClick={toggleConversation}
                    className={`flex items-center justify-center w-24 h-24 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                      isConversationActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                    }`}
                  >
                    {isConversationActive ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                  </Button>

                  <div className="text-sm text-center space-y-1">
                    <p className="font-medium text-foreground">
                      {isConversationActive ? "🎤 Conversation active" : "🔇 Conversation fermée"}
                    </p>
                    <p className="text-muted-foreground">
                      {isConversationActive 
                        ? isSpeaking 
                          ? "🗣️ Cuizly vous répond - Vous pouvez l'interrompre"
                          : "👂 Parlez naturellement, je vous écoute"
                        : "Cliquez pour démarrer la conversation vocale"
                      }
                    </p>
                  </div>
                </div>

                {/* Current message display */}
                {currentMessage && (
                  <div className="mt-6 p-4 bg-muted rounded-2xl max-w-sm mx-auto">
                    <p className="text-sm text-muted-foreground mb-1">Vous avez dit :</p>
                    <p className="text-foreground">{currentMessage}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-6">
              <div className="text-center space-y-4">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-foreground">{t('voiceChat.mainTitle')}</h2>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {t('voiceChat.askRecommendations')}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Messages History */}
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
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        <ChefHat className="h-5 w-5" />
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
                  }`}>
                    {message.isTyping ? (
                      <TypewriterRichText
                        text={message.content}
                        onComplete={() => handleTypewriterStop(message.content, message.id)}
                        shouldStop={shouldStopTyping}
                        onStopped={(partialText) => handleTypewriterStop(partialText, message.id)}
                      />
                    ) : (
                      <RichTextRenderer content={message.content} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4 max-w-[85%]">
                  <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      <ChefHat className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-3xl px-6 py-4 bg-muted text-foreground">
                    <ThinkingIndicator />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area for Text Mode */}
          {inputMode === 'text' && (
            <div className="border-t border-border bg-background px-6 py-4">
              <form onSubmit={handleTextSubmit} className="flex items-center space-x-3">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isProcessing ? "" : "Tapez votre question à Cuizly..."}
                  disabled={isProcessing}
                  className="flex-1 rounded-full border-border focus-visible:ring-primary"
                />
                
                {isProcessing ? (
                  <Button
                    type="button"
                    onClick={stopGeneration}
                    variant="destructive"
                    size="sm"
                    className="rounded-full px-4"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Arrêter
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={!textInput.trim() || isProcessing}
                    className="rounded-full px-6 bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Envoyer
                  </Button>
                )}
              </form>

              <div className="text-center mt-3">
                <p className="text-xs text-muted-foreground">
                  {isProcessing ? "Traitement en cours..." : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default VoiceChatInterface;