import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, X, Volume2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chefIconUrl = '/lovable-uploads/97e26fec-7714-4a4d-b4da-dcdbf84f3800.png';

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
        
        console.log('🎤 Speech detected:', text);
        
        if (text.includes('hey cuizly') || text.includes('hé cuizly')) {
          console.log('✅ Hey Cuizly detected!');
          setKeywordDetected(true);
          keywordRecognition?.stop();
          setTimeout(() => {
            startConversation();
            setKeywordDetected(false);
          }, 500);
        }
      };
      
      keywordRecognition.onspeechstart = () => {
        setIsUserSpeaking(true);
      };
      
      keywordRecognition.onspeechend = () => {
        setIsUserSpeaking(false);
      };
      
      keywordRecognition.onerror = (event: any) => {
        console.log('Keyword detection error:', event.error);
        setIsUserSpeaking(false);
      };
      
      if (isListening) {
        keywordRecognition.start();
      }
    }
    
    return () => {
      keywordRecognition?.stop();
      setIsUserSpeaking(false);
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
        text: 'Activé',
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
      text: 'Terminé',
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

  // Simple Audio Visualizer like ChatGPT
  const AudioVisualizer = () => {
    return (
      <div className="relative h-32 bg-background rounded-lg border border-border/20 overflow-hidden">
        <div className="relative h-full flex items-center justify-center">
          {isConnected ? (
            <div className="flex items-end gap-1">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-sm transition-all duration-300",
                    (isSpeaking || isUserSpeaking)
                      ? "bg-cuizly-primary" 
                      : "bg-border"
                  )}
                  style={{
                    height: (isSpeaking || isUserSpeaking)
                      ? `${Math.random() * 20 + 10}px` 
                      : '4px'
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cuizly-primary/10 flex items-center justify-center mx-auto">
                <img src={chefIconUrl} alt="Chef" className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnecting ? (
                  "Connexion..."
                ) : keywordDetected ? (
                  "Activé!"
                ) : isListening ? (
                  'Dites "Hey Cuizly"'
                ) : (
                  'Prêt'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Simple Message Component like ChatGPT
  const MessageComponent = ({ message }: { message: Message; index: number }) => (
    <div className={cn(
      "mb-4",
      message.role === 'system' ? "text-center" : ""
    )}>
      {message.role === 'system' ? (
        <div className="bg-muted/50 text-muted-foreground text-center text-xs py-1 px-3 rounded-full inline-block">
          {message.text}
        </div>
      ) : (
        <div className={cn(
          "flex gap-3",
          message.role === 'user' ? "flex-row-reverse" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {message.role === 'assistant' ? (
              <img src={chefIconUrl} alt="Chef" className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 bg-cuizly-primary rounded-full" />
            )}
          </div>
          <div className={cn(
            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
            message.role === 'assistant'
              ? "bg-muted text-foreground"
              : "bg-cuizly-primary text-white"
          )}>
            {message.text}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        {/* Simple Header like ChatGPT */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cuizly-primary/10 flex items-center justify-center">
              <img src={chefIconUrl} alt="Chef" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Assistant Vocal</h2>
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Connecté' : isListening ? 'En écoute' : 'Déconnecté'}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-md hover:bg-muted"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Simple Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="space-y-3">
              <label className="text-sm font-medium">Voix de l'assistant</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy</SelectItem>
                  <SelectItem value="echo">Echo</SelectItem>
                  <SelectItem value="nova">Nova</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex flex-col h-[60vh]">
          {/* Simple Audio Visualizer */}
          <div className="p-4">
            <AudioVisualizer />
          </div>

          {/* Simple Messages */}
          <div className="flex-1 overflow-hidden px-4">
            {messages.length > 0 ? (
              <div className="h-full overflow-y-auto space-y-3">
                {messages.map((message, index) => (
                  <MessageComponent key={index} message={message} index={index} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <h3 className="text-lg font-medium">Commencez une conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Dites "Hey Cuizly" ou cliquez sur le bouton
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Simple Controls */}
          <div className="p-4 border-t border-border">
            <div className="flex justify-center">
              {!isConnected ? (
                <Button 
                  onClick={startConversation}
                  disabled={isConnecting}
                  className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white px-6 py-2"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Démarrer
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={endConversation}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 px-6 py-2"
                >
                  <MicOff className="w-4 h-4 mr-2" />
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