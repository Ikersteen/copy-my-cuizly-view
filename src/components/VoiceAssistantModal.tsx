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

  // Audio Visualizer Component with beautiful animations
  const AudioVisualizer = () => {
    const [wavePhase, setWavePhase] = useState(0);
    const [pulsePhase, setPulsePhase] = useState(0);

    useEffect(() => {
      let waveInterval: NodeJS.Timeout;
      let pulseInterval: NodeJS.Timeout;
      
      if (isSpeaking || isUserSpeaking) {
        waveInterval = setInterval(() => {
          setWavePhase(prev => prev + 0.2);
        }, 50);
        
        pulseInterval = setInterval(() => {
          setPulsePhase(prev => prev + 0.1);
        }, 100);
      }
      
      return () => {
        clearInterval(waveInterval);
        clearInterval(pulseInterval);
      };
    }, [isSpeaking, isUserSpeaking]);

    return (
      <div className="relative h-40 bg-gradient-to-br from-background via-cuizly-surface/20 to-background rounded-3xl border border-cuizly-primary/10 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cuizly-primary/5">
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 transition-all duration-1000 ease-out opacity-60",
          isConnected 
            ? "bg-gradient-to-r from-cuizly-primary/8 via-cuizly-accent/12 to-cuizly-primary/8" 
            : "bg-gradient-to-r from-cuizly-primary/2 via-cuizly-accent/4 to-cuizly-primary/2"
        )}>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent transition-opacity duration-1000",
            isConnected && "animate-pulse"
          )} />
        </div>
        
        {/* Floating orbs */}
        {isConnected && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-cuizly-primary/40 to-cuizly-accent/40 rounded-full shadow-lg"
                style={{
                  left: `${15 + (i * 15)}%`,
                  top: `${25 + Math.sin(pulsePhase + i) * 15}%`,
                  transform: `scale(${0.5 + Math.sin(pulsePhase + i * 0.5) * 0.3})`,
                  animation: `float-${i} 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  filter: 'blur(0.5px)'
                }}
              />
            ))}
          </div>
        )}
        
        <div className="relative h-full flex items-center justify-center">
          {isConnected ? (
            <div className="flex items-end gap-1.5 px-4">
              {[...Array(20)].map((_, i) => {
                const baseHeight = 8;
                const maxHeight = 45;
                const waveHeight = (isSpeaking || isUserSpeaking) 
                  ? baseHeight + Math.abs(Math.sin(wavePhase + i * 0.4)) * maxHeight
                  : baseHeight + Math.random() * 3;
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 rounded-full transition-all duration-200 ease-out shadow-sm",
                      (isSpeaking || isUserSpeaking)
                        ? "bg-gradient-to-t from-cuizly-primary via-cuizly-accent to-cuizly-primary/80 shadow-cuizly-primary/30" 
                        : "bg-gradient-to-t from-cuizly-neutral/30 to-cuizly-neutral/60 hover:from-cuizly-primary/50 hover:to-cuizly-accent/50"
                    )}
                    style={{
                      height: `${waveHeight}px`,
                      transform: (isSpeaking || isUserSpeaking) 
                        ? `scaleY(${0.9 + Math.sin(wavePhase + i * 0.3) * 0.2})` 
                        : 'scaleY(1)',
                      filter: (isSpeaking || isUserSpeaking) ? 'drop-shadow(0 0 8px rgba(var(--cuizly-primary), 0.3))' : 'none'
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-6 duration-700 ease-out">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto relative transition-all duration-700 ease-out",
                keywordDetected 
                  ? "bg-gradient-to-br from-cuizly-primary/20 to-cuizly-accent/30 scale-110 shadow-2xl shadow-cuizly-primary/40" 
                  : "bg-gradient-to-br from-cuizly-primary/10 to-cuizly-accent/15 hover:scale-105 hover:shadow-xl hover:shadow-cuizly-primary/20"
              )}>
                {/* Pulsing ring */}
                <div className={cn(
                  "absolute inset-0 rounded-full border-2 transition-all duration-1000",
                  keywordDetected 
                    ? "border-cuizly-primary/50 animate-ping" 
                    : "border-cuizly-primary/20"
                )} />
                
                <img 
                  src={chefIconUrl} 
                  alt="Chef" 
                  className={cn(
                    "w-10 h-10 transition-all duration-500 relative z-10",
                    keywordDetected ? "animate-bounce filter drop-shadow-lg" : "hover:scale-110"
                  )} 
                />
              </div>
              
              <div className="space-y-2">
                <p className={cn(
                  "text-base font-medium transition-all duration-500",
                  keywordDetected ? "text-cuizly-primary scale-105" : "text-foreground"
                )}>
                  {isConnecting ? (
                    <span className="flex items-center gap-3 justify-center">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      Connexion...
                    </span>
                  ) : keywordDetected ? (
                    <span className="text-cuizly-primary animate-pulse text-lg font-semibold">Activé !</span>
                  ) : isListening ? (
                    'Dites "Hey Cuizly"'
                  ) : (
                    'Prêt à converser'
                  )}
                </p>
                
                {!isConnecting && !keywordDetected && (
                  <p className="text-sm text-cuizly-neutral/70 animate-in fade-in-0 duration-1000 delay-300">
                    {isListening ? 'Assistant en écoute...' : 'Cliquez pour commencer'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced speaking indicator with ripple effect */}
        {(isSpeaking || isUserSpeaking) && (
          <div className="absolute top-4 right-4 animate-in fade-in-0 scale-in-0 duration-500">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 bg-cuizly-primary/20 rounded-full animate-ping" />
              <div className="absolute w-6 h-6 bg-cuizly-primary/30 rounded-full animate-ping animation-delay-75" />
              <Volume2 className="w-5 h-5 text-cuizly-primary relative z-10 animate-pulse" />
            </div>
          </div>
        )}

        {/* Elegant status indicator */}
        <div className="absolute bottom-4 left-4 animate-in slide-in-from-left-4 fade-in-0 duration-700">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-500 border",
            isConnected 
              ? "bg-green-50/80 border-green-200/50 text-green-700" 
              : "bg-gray-50/80 border-gray-200/50 text-gray-600"
          )}>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm",
              isConnected 
                ? "bg-green-500 animate-pulse shadow-green-500/50" 
                : "bg-gray-400"
            )} />
            <span className="text-xs font-medium">
              {isConnected ? 'Connecté' : 'Déconnecté'}
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
        {/* Modern Header with fluid animations */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/30 bg-gradient-to-r from-background/50 via-cuizly-surface/10 to-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 group">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center relative transition-all duration-500 ease-out",
              "bg-gradient-to-br from-cuizly-primary via-cuizly-accent to-cuizly-primary shadow-xl",
              isConnected 
                ? "shadow-cuizly-primary/40 scale-105" 
                : "group-hover:scale-110 group-hover:shadow-cuizly-primary/30"
            )}>
              <img src={chefIconUrl} alt="Chef" className="w-7 h-7 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              
              {/* Multi-layer animated rings */}
              {isConnected && (
                <>
                  <div className="absolute inset-0 rounded-2xl border-2 border-cuizly-primary/40 animate-ping" />
                  <div className="absolute inset-[-4px] rounded-2xl border border-cuizly-accent/30 animate-pulse" />
                </>
              )}
              
              {/* Background glow */}
              <div className={cn(
                "absolute inset-[-8px] rounded-3xl transition-all duration-500",
                isConnected 
                  ? "bg-gradient-to-br from-cuizly-primary/20 to-cuizly-accent/20 blur-md animate-pulse" 
                  : "bg-gradient-to-br from-cuizly-primary/10 to-cuizly-accent/10 blur-sm opacity-0 group-hover:opacity-100"
              )} />
            </div>
            
            <div className="transition-all duration-300 group-hover:translate-x-2">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-lg text-foreground">Assistant Vocal Cuizly</h2>
                {keywordDetected && (
                  <div className="px-3 py-1 bg-gradient-to-r from-cuizly-primary to-cuizly-accent text-white text-xs font-medium rounded-full animate-bounce shadow-lg">
                    ✨ Activé !
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-1">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-500 relative",
                  isConnected ? "bg-green-500 shadow-lg shadow-green-500/60" : "bg-gray-400"
                )}>
                  {isConnected && (
                    <>
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                      <div className="absolute inset-[-2px] bg-green-300 rounded-full animate-pulse opacity-50" />
                    </>
                  )}
                </div>
                
                <p className={cn(
                  "text-sm font-medium transition-all duration-300",
                  isConnected ? "text-green-600" : "text-cuizly-neutral"
                )}>
                  {isConnected ? (
                    <span className="flex items-center gap-2">
                      Connecté et prêt
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </span>
                  ) : isListening ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-pulse" />
                      En écoute de "Hey Cuizly"
                    </span>
                  ) : (
                    'Déconnecté'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 pb-4 border-b border-border/50 bg-muted/30">
            <div className="space-y-4">
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
                      Dites "Hey Cuizly" ou cliquez sur le bouton pour commencer.
                    </p>
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
                    "relative overflow-hidden group transition-all duration-500 ease-out transform hover:scale-110 active:scale-95",
                    "bg-gradient-to-r from-cuizly-primary via-cuizly-accent to-cuizly-primary",
                    "text-white px-10 py-4 shadow-2xl hover:shadow-3xl shadow-cuizly-primary/30 hover:shadow-cuizly-primary/50",
                    "border-2 border-white/20 hover:border-white/40 rounded-2xl font-semibold text-base",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
                    "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                  )}
                >
                  {isConnecting ? (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="animate-pulse">Connexion en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 relative z-10">
                      <Mic className={cn(
                        "w-6 h-6 transition-all duration-300",
                        keywordDetected ? "animate-bounce scale-110" : "group-hover:scale-110"
                      )} />
                      <span>Démarrer la conversation</span>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                    </div>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={endConversation}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "relative overflow-hidden group transition-all duration-500 ease-out transform hover:scale-105 active:scale-95",
                    "border-2 border-red-300/60 text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-100/80",
                    "px-10 py-4 rounded-2xl font-semibold text-base backdrop-blur-sm",
                    "shadow-lg hover:shadow-xl shadow-red-200/30 hover:shadow-red-300/50",
                    "hover:border-red-400/80 transition-all duration-300"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-100/0 via-red-200/30 to-red-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <MicOff className="w-6 h-6 transition-all duration-300 group-hover:scale-110" />
                    <span>Terminer la conversation</span>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  </div>
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