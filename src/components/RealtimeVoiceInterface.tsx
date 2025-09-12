import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Volume2, VolumeX, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RealtimeVoiceInterfaceProps {
  onClose?: () => void;
}

const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);

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
      voiceClientRef.current = new RealtimeVoiceClient(handleMessage);
      await voiceClientRef.current.connect();
      };

      await voiceClientRef.current.init(userId);
      setIsConnected(true);
      
      toast({
        title: "Connecté",
        description: "Conversation temps réel démarrée - Parlez naturellement",
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : 'Impossible de démarrer la conversation',
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    if (voiceClientRef.current) {
      voiceClientRef.current.disconnect();
      voiceClientRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setCurrentMessage('');
    
    toast({
      title: "Déconnecté",
      description: "Conversation temps réel terminée",
    });
  };

  useEffect(() => {
    return () => {
      if (voiceClientRef.current) {
        voiceClientRef.current.disconnect();
      }
    };
  }, []);

  // Animated orb component
  const AnimatedOrb = () => (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings */}
      {isSpeaking && (
        <>
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse" />
        </>
      )}
      
      {/* Main orb */}
      <div className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
        isConnected 
          ? isSpeaking
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl shadow-blue-500/50 scale-110'
            : 'bg-gradient-to-r from-green-500 to-blue-500 shadow-lg shadow-green-500/30'
          : 'bg-gradient-to-r from-gray-400 to-gray-500'
      }`}>
        {/* Inner glow effect */}
        <div className={`absolute inset-2 rounded-full transition-all duration-300 ${
          isConnected 
            ? 'bg-gradient-to-r from-white/20 to-white/10'
            : 'bg-white/10'
        }`} />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isConnected ? (
            isSpeaking ? (
              <Volume2 className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )
          ) : (
            <MicOff className="w-8 h-8 text-white/70" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && !isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
            <AnimatedOrb />
            <div className="space-y-3 max-w-lg">
              <h1 className="text-2xl font-semibold text-foreground">
                Mode vocal
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Parlez naturellement avec l'assistant Cuizly et obtenez des recommandations personnalisées.
              </p>
            </div>
          </div>
        )}

        {/* Connected state with orb */}
        {isConnected && (
          <div className="flex flex-col items-center space-y-6">
            <AnimatedOrb />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">
                {isSpeaking ? "🗣️ Cuizly vous répond..." : "👂 Je vous écoute..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSpeaking 
                  ? "L'assistant parle - Vous pouvez l'interrompre à tout moment"
                  : "Parlez naturellement, la conversation est fluide"
                }
              </p>
            </div>
          </div>
        )}

        {/* Current message display */}
        {currentMessage && (
          <div className="flex justify-start">
            <div className="flex items-start gap-4 max-w-[85%]">
              <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-background dark:bg-primary/20 text-foreground border border-border dark:border-primary/30">
                  <UserIcon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-3xl px-6 py-4 bg-muted text-foreground">
                <p className="text-base leading-relaxed">{currentMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message history */}
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
              }`}>
                <p className="text-base leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Control Area */}
      <div className="border-t border-border bg-background px-6 py-6">
        <div className="flex items-center justify-center space-x-4">
          {!isConnected ? (
            <Button
              onClick={startConversation}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Mic className="w-5 h-5 mr-2" />
              Démarrer la Conversation
            </Button>
          ) : (
            <Button
              onClick={endConversation}
              variant="destructive"
              className="px-8 py-4 rounded-full font-medium"
            >
              <MicOff className="w-5 h-5 mr-2" />
              Terminer
            </Button>
          )}
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {!isConnected 
              ? "Assistant vocal intelligent"
              : "Conversation active - Parlez quand vous voulez"
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealtimeVoiceInterface;