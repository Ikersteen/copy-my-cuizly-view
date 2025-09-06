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
        
        if (text.includes('hey cuizly') || text.includes('hé cuizly')) {
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

  // Audio Visualizer Component with enhanced animations
  const AudioVisualizer = () => {
    const [animationPhase, setAnimationPhase] = useState(0);

    useEffect(() => {
      if (isSpeaking || isUserSpeaking) {
        const interval = setInterval(() => {
          setAnimationPhase(prev => prev + 1);
        }, 100);
        return () => clearInterval(interval);
      }
    }, [isSpeaking, isUserSpeaking]);

    return (
      <div className="relative h-40 bg-gradient-to-br from-cuizly-surface/80 to-muted/50 rounded-2xl border border-border/50 backdrop-blur-sm overflow-hidden group">
        {/* Background glow effect */}
        <div className={cn(
          "absolute inset-0 transition-all duration-1000",
          isConnected 
            ? "bg-gradient-to-r from-cuizly-primary/5 via-cuizly-accent/10 to-cuizly-primary/5 animate-pulse" 
            : "bg-gradient-to-r from-transparent via-cuizly-primary/3 to-transparent"
        )} />
        
        {/* Floating particles effect when connected */}
        {isConnected && (
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cuizly-primary/30 rounded-full animate-ping"
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${30 + Math.sin(i) * 20}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        )}
        
        <div className="relative h-full flex items-center justify-center">
          {isConnected ? (
            <div className="flex items-end gap-1">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all duration-150 ease-out transform",
                    (isSpeaking || isUserSpeaking)
                      ? "bg-gradient-to-t from-cuizly-primary via-cuizly-accent to-cuizly-primary shadow-lg shadow-cuizly-primary/50" 
                      : "bg-cuizly-neutral/40 hover:bg-cuizly-primary/60"
                  )}
                  style={{
                    height: (isSpeaking || isUserSpeaking)
                      ? `${Math.abs(Math.sin((animationPhase * 0.1) + i * 0.3)) * 35 + 15}px` 
                      : '6px',
                    animationDelay: `${i * 20}ms`,
                    transform: (isSpeaking || isUserSpeaking) 
                      ? `scaleY(${0.8 + Math.abs(Math.sin((animationPhase * 0.05) + i * 0.2)) * 0.4})` 
                      : 'scaleY(1)'
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-500",
                keywordDetected 
                  ? "bg-cuizly-primary/20 scale-110 shadow-lg shadow-cuizly-primary/30" 
                  : "bg-cuizly-primary/10 hover:bg-cuizly-primary/15 hover:scale-105"
              )}>
                <img 
                  src={chefIconUrl} 
                  alt="Chef" 
                  className={cn(
                    "w-8 h-8 transition-all duration-300",
                    keywordDetected && "animate-bounce"
                  )} 
                />
              </div>
              <p className={cn(
                "text-sm transition-all duration-300",
                keywordDetected ? "text-cuizly-primary font-medium" : "text-cuizly-neutral"
              )}>
                {isConnecting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-pulse" />
                    Connexion en cours...
                  </span>
                ) : keywordDetected ? (
                  <span className="text-cuizly-primary">Détecté!</span>
                ) : isListening ? (
                  'Dites "Hey Cuizly"'
                ) : (
                  'Prêt'
                )}
              </p>
            </div>
          )}
        </div>
        
        {/* Enhanced speaking indicator */}
        {(isSpeaking || isUserSpeaking) && (
          <div className="absolute top-4 right-4 animate-in fade-in-0 scale-in-0 duration-300">
            <div className="relative">
              <Volume2 className="w-5 h-5 text-cuizly-primary animate-pulse" />
              <div className="absolute inset-0 w-5 h-5 bg-cuizly-primary/20 rounded-full animate-ping" />
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute bottom-4 left-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm transition-all duration-300",
            isConnected ? "bg-green-500/10 border border-green-500/20" : "bg-gray-500/10 border border-gray-500/20"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className="text-xs font-medium">
              {isConnected ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Message Component with better animations
  const MessageComponent = ({ message, index }: { message: Message; index: number }) => (
    <div 
      className={cn(
        "animate-in fade-in-0 slide-in-from-bottom-2 mb-3 transition-all duration-300",
        message.role === 'system' ? "text-center" : ""
      )}
      style={{ 
        animationDelay: `${index * 150}ms`,
        animationDuration: '0.5s'
      }}
    >
      {message.role === 'system' ? (
        <div className="bg-muted/50 text-cuizly-neutral text-center italic text-xs py-2 px-4 rounded-full inline-block backdrop-blur-sm border border-border/30 animate-in fade-in-0 scale-in-95 duration-300">
          {message.text}
        </div>
      ) : (
        <div className={cn(
          "flex flex-col gap-1 group",
          message.role === 'user' ? "items-end" : "items-start"
        )}>
          <div className="text-xs text-cuizly-neutral/70 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {message.role === 'assistant' ? (
              <span className="flex items-center gap-1">
                <img src={chefIconUrl} alt="Chef" className="w-3 h-3" />
                Cuizly
              </span>
            ) : (
              'Vous'
            )} • {message.timestamp.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          <div className={cn(
            "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
            message.role === 'assistant'
              ? "bg-gradient-to-br from-cuizly-surface to-cuizly-surface/80 border border-border/50 text-foreground shadow-sm hover:shadow-cuizly-primary/10 hover:border-cuizly-primary/20"
              : "bg-gradient-to-br from-cuizly-primary to-cuizly-accent text-white shadow-sm hover:shadow-cuizly-primary/30"
          )}>
            <div className="relative">
              {message.text}
              {/* Subtle typing animation for new messages */}
              {index === messages.length - 1 && message.role === 'assistant' && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cuizly-primary/50 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        {/* Enhanced Header with animations */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-background via-cuizly-surface/20 to-background">
          <div className="flex items-center gap-3 group">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-300",
              "bg-gradient-to-br from-cuizly-primary to-cuizly-accent shadow-lg",
              isConnected ? "animate-pulse shadow-cuizly-primary/30" : "group-hover:scale-110"
            )}>
              <img src={chefIconUrl} alt="Chef" className="w-6 h-6 relative z-10" />
              {/* Animated ring for connected state */}
              {isConnected && (
                <div className="absolute inset-0 rounded-full border-2 border-cuizly-primary/30 animate-ping" />
              )}
            </div>
            <div className="transition-all duration-300 group-hover:translate-x-1">
              <p className="font-semibold text-foreground flex items-center gap-2">
                Assistant Vocal Cuizly
                {keywordDetected && (
                  <span className="text-xs bg-cuizly-primary/10 text-cuizly-primary px-2 py-1 rounded-full animate-bounce">
                    Activé!
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  isConnected ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" : "bg-gray-400"
                )} />
                <p className={cn(
                  "text-xs transition-all duration-300",
                  isConnected ? "text-green-600 font-medium" : "text-cuizly-neutral"
                )}>
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      En ligne
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                    </span>
                  ) : isListening ? (
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-cuizly-primary rounded-full animate-pulse" />
                      Écoute "Hey Cuizly"
                    </span>
                  ) : (
                    'Hors ligne'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "rounded-full hover:bg-muted/80",
              showSettings ? "bg-cuizly-primary/10 text-cuizly-primary" : ""
            )}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 pb-4 border-b border-border/50 bg-muted/30">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Paramètres</h3>
              <div className="space-y-2">
                <label className="text-xs text-cuizly-neutral">Voix de l'assistant</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy (Neutre)</SelectItem>
                    <SelectItem value="echo">Echo (Masculin)</SelectItem>
                    <SelectItem value="fable">Fable (Britannique)</SelectItem>
                    <SelectItem value="onyx">Onyx (Profond)</SelectItem>
                    <SelectItem value="nova">Nova (Féminin)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Doux)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col h-[70vh]">
          {/* Audio Visualizer */}
          <div className="p-6 pb-4">
            <AudioVisualizer />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden px-6">
            {messages.length > 0 ? (
              <div className="h-full overflow-y-auto space-y-2 pr-2">
                {messages.map((message, index) => (
                  <MessageComponent key={index} message={message} index={index} />
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

          {/* Controls with enhanced animations */}
          <div className="p-6 pt-4 border-t border-border/50 bg-gradient-to-t from-background/50 to-transparent">
            <div className="flex justify-center">
              {!isConnected ? (
                <Button 
                  onClick={startConversation}
                  disabled={isConnecting}
                  size="lg"
                  className={cn(
                    "relative overflow-hidden group transition-all duration-300 transform hover:scale-105",
                    "bg-gradient-to-r from-cuizly-primary via-cuizly-accent to-cuizly-primary bg-size-200 bg-pos-0 hover:bg-pos-100",
                    "text-white px-8 py-3 shadow-lg hover:shadow-xl hover:shadow-cuizly-primary/30",
                    "border border-cuizly-primary/20 hover:border-cuizly-primary/40"
                  )}
                >
                  {/* Background animation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      <span className="animate-pulse">Connexion...</span>
                    </>
                  ) : (
                    <>
                      <Mic className={cn(
                        "w-5 h-5 mr-2 transition-all duration-300",
                        keywordDetected && "animate-bounce"
                      )} />
                      <span className="font-medium">Démarrer la conversation</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={endConversation}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "relative overflow-hidden group transition-all duration-300 transform hover:scale-105",
                    "border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-8 py-3",
                    "shadow-sm hover:shadow-lg hover:shadow-red-200/50"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <MicOff className="w-5 h-5 mr-2 relative z-10 group-hover:animate-pulse" />
                  <span className="font-medium relative z-10">Terminer</span>
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