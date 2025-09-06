import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import cuizlyIcon from '@/assets/cuizly-icon.png';

// Type declarations for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  type: 'transcript' | 'system';
  text: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [keywordDetected, setKeywordDetected] = useState(false);
  
  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keyword detection effect
  useEffect(() => {
    let keywordRecognition: any = null;
    
    if ((window.webkitSpeechRecognition || window.SpeechRecognition) && !isConnected) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      keywordRecognition = new SpeechRecognition();
      keywordRecognition.continuous = true;
      keywordRecognition.interimResults = true;
      keywordRecognition.lang = 'fr-FR';
      
      keywordRecognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.toLowerCase();
        
        if (text.includes('hey cuizly') || text.includes('hé cuizly')) {
          setKeywordDetected(true);
          keywordRecognition?.stop();
          setTimeout(() => {
            startConversation();
            setKeywordDetected(false);
          }, 500);
        }
      };
      
      keywordRecognition.onerror = (event: any) => {
        console.log('Keyword detection error:', event.error);
      };
      
      if (isListening) {
        keywordRecognition.start();
      }
    }
    
    return () => {
      keywordRecognition?.stop();
    };
  }, [isListening, isConnected]);

  // Start keyword detection when modal opens
  useEffect(() => {
    if (isOpen && !isConnected) {
      setIsListening(true);
    } else {
      setIsListening(false);
    }
  }, [isOpen, isConnected]);

  const handleMessage = (message: any) => {
    if (message.type === 'transcript' && message.text) {
      setMessages(prev => [...prev, {
        type: 'transcript',
        text: message.text,
        role: message.role,
        timestamp: new Date()
      }]);
    }
  };

  const startConversation = async () => {
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      voiceClientRef.current = new RealtimeVoiceClient(handleMessage, setIsSpeaking);
      await voiceClientRef.current.init(userId);
      
      setIsConnected(true);
      setIsListening(false);
      setMessages([{
        type: 'system',
        text: 'Assistant vocal activé - Parlez maintenant!',
        role: 'system',
        timestamp: new Date()
      }]);
      
      toast({
        title: "Connecté",
        description: "L'assistant vocal est prêt!",
      });
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Impossible de démarrer la conversation',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    voiceClientRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(true);
    setMessages(prev => [...prev, {
      type: 'system',
      text: 'Conversation terminée',
      role: 'system',
      timestamp: new Date()
    }]);
  };

  const handleClose = () => {
    if (isConnected) {
      endConversation();
    }
    setIsListening(false);
    onClose();
  };

  // Audio Visualizer Component
  const AudioVisualizer = () => (
    <div className="relative h-40 bg-gradient-to-br from-cuizly-surface/80 to-muted/50 rounded-2xl border border-border/50 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cuizly-primary/5 to-transparent animate-pulse" />
      
      <div className="relative h-full flex items-center justify-center">
        {isConnected ? (
          <div className="flex items-end gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-300 ease-out",
                  isSpeaking 
                    ? "bg-gradient-to-t from-cuizly-primary to-cuizly-accent animate-pulse" 
                    : "bg-cuizly-neutral/40"
                )}
                style={{
                  height: isSpeaking 
                    ? `${Math.random() * 40 + 20}px` 
                    : '8px',
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-cuizly-primary/10 flex items-center justify-center mx-auto">
              <img src={cuizlyIcon} alt="Cuizly" className="w-8 h-8" />
            </div>
            <p className="text-sm text-cuizly-neutral">
              {isConnecting ? 'Connexion en cours...' : 
               keywordDetected ? 'Hey Cuizly détecté!' :
               isListening ? 'Dites "Hey Cuizly" pour commencer' : 
               'Prêt à converser'}
            </p>
          </div>
        )}
      </div>
      
      {isSpeaking && (
        <div className="absolute top-4 right-4">
          <Volume2 className="w-5 h-5 text-cuizly-primary animate-pulse" />
        </div>
      )}
    </div>
  );

  // Message Bubble Component
  const MessageBubble = ({ message, index }: { message: Message; index: number }) => (
    <div 
      className={cn(
        "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2",
        message.role === 'system' && "justify-center"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {message.role !== 'system' && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
          message.role === 'assistant' 
            ? "bg-cuizly-primary text-white" 
            : "bg-cuizly-surface border border-border"
        )}>
          {message.role === 'assistant' ? (
            <img src={cuizlyIcon} alt="Assistant" className="w-5 h-5" />
          ) : (
            '👤'
          )}
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
        message.role === 'system' 
          ? "bg-muted/50 text-cuizly-neutral text-center italic text-xs" 
          : message.role === 'assistant'
          ? "bg-cuizly-surface border border-border text-foreground"
          : "bg-cuizly-primary text-white ml-auto"
      )}>
        {message.text}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cuizly-primary to-cuizly-accent flex items-center justify-center">
              <img src={cuizlyIcon} alt="Cuizly" className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Assistant Vocal Cuizly</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )} />
                <p className="text-xs text-cuizly-neutral">
                  {isConnected ? 'En ligne' : 
                   isListening ? 'Écoute "Hey Cuizly"' :
                   'Hors ligne'}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full hover:bg-muted/80"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col h-[70vh]">
          {/* Audio Visualizer */}
          <div className="p-6 pb-4">
            <AudioVisualizer />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden px-6">
            {messages.length > 0 ? (
              <div className="h-full overflow-y-auto space-y-4 pr-2">
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} index={index} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-2xl">💬</div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground">Commencez une conversation</h3>
                    <p className="text-sm text-cuizly-neutral">
                      Dites "Hey Cuizly" ou cliquez sur le bouton pour commencer. Je peux vous aider à trouver des restaurants et gérer vos préférences.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-xs text-cuizly-neutral">
                      "Trouve-moi un resto italien"
                    </div>
                    <div className="px-3 py-1 bg-muted/50 rounded-full text-xs text-cuizly-neutral">
                      "Mes préférences"
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 pt-4 border-t border-border/50">
            <div className="flex justify-center">
              {!isConnected ? (
                <Button 
                  onClick={startConversation}
                  disabled={isConnecting}
                  size="lg"
                  className="bg-gradient-to-r from-cuizly-primary to-cuizly-accent hover:shadow-lg transition-all duration-300 text-white px-8"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Démarrer la conversation
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={endConversation}
                  variant="outline"
                  size="lg"
                  className="border-red-200 text-red-600 hover:bg-red-50 px-8"
                >
                  <MicOff className="w-5 h-5 mr-2" />
                  Terminer
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAssistantModal;