import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Send, Menu, Settings, User, MessageSquare, History, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { supabase } from '@/integrations/supabase/client';
import cuizlyLogo from '@/assets/cuizly-logo.png';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface VoiceChatInterfaceProps {
  onClose?: () => void;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleMessage = (message: any) => {
    if (message.type === 'transcript' && message.text) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: message.role === 'user' ? 'user' : 'assistant',
        content: message.text,
        timestamp: new Date(),
        isAudio: true
      }]);
    }
  };

  const startVoiceSession = async () => {
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      voiceClientRef.current = new RealtimeVoiceClient(handleMessage, setIsSpeaking);
      await voiceClientRef.current.init(userId);
      
      setIsConnected(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: '🎙️ Assistant vocal Cuizly activé! Vous pouvez maintenant parler ou taper votre message.',
        timestamp: new Date()
      }]);
      
      toast({
        title: "Connecté",
        description: "L'assistant vocal est prêt!",
      });
    } catch (error) {
      console.error('❌ Error starting voice session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'assistant vocal",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endVoiceSession = () => {
    voiceClientRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: '🔌 Session vocale terminée',
      timestamp: new Date()
    }]);
  };

  const sendTextMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Here you would send to your AI processing
    // For now, just add a dummy response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Je cherche des recommandations pour "${inputText}"...`,
        timestamp: new Date()
      }]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden bg-muted/30 border-r`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <img src={cuizlyLogo} alt="Cuizly" className="w-8 h-8" />
            <h2 className="font-semibold text-lg">Assistant Cuizly</h2>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" />
                Historique
              </h3>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                  Resto italien près de moi
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                  Mes préférences alimentaires
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-left">
                  Réservation pour ce soir
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="w-4 h-4" />
                Outils
              </h3>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Recommandations
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Mes préférences
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <img src={cuizlyLogo} alt="Cuizly" className="w-8 h-8" />
            <h1 className="text-xl font-semibold">Assistant Vocal Cuizly</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isConnected && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Connecté
                </div>
              )}
            </div>
            <Avatar className="w-8 h-8">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback>
                {userProfile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Bonjour! Comment puis-je vous aider?</h3>
                <p className="text-muted-foreground max-w-md">
                  Parlez ou tapez votre message pour commencer. Je peux vous aider à trouver des restaurants, 
                  gérer vos préférences, et bien plus!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 max-w-md">
                <Button variant="outline" size="sm">
                  "Trouve-moi un resto italien"
                </Button>
                <Button variant="outline" size="sm">
                  "Mes préférences alimentaires"
                </Button>
                <Button variant="outline" size="sm">
                  "Réserver une table"
                </Button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[70%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {message.type !== 'system' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {message.type === 'assistant' ? (
                      <AvatarImage src={cuizlyLogo} />
                    ) : (
                      <AvatarImage src={userProfile?.avatar_url} />
                    )}
                    <AvatarFallback>
                      {message.type === 'assistant' ? '🤖' : userProfile?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`rounded-2xl px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : message.type === 'system'
                    ? 'bg-muted text-muted-foreground text-center italic text-sm'
                    : 'bg-muted'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.isAudio && (
                    <div className="text-xs opacity-60 mt-1">
                      🎙️ Audio
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isSpeaking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-muted-foreground">L'assistant parle...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/95 backdrop-blur p-4">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message ou utilisez le micro..."
                className="pr-12 rounded-full"
                disabled={isConnecting}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={sendTextMessage}
                disabled={!inputText.trim() || isConnecting}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="relative">
              {!isConnected ? (
                <Button
                  onClick={startVoiceSession}
                  disabled={isConnecting}
                  size="icon"
                  className="rounded-full w-12 h-12"
                >
                  {isConnecting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              ) : (
                <Button
                  onClick={endVoiceSession}
                  size="icon"
                  variant="destructive"
                  className="rounded-full w-12 h-12"
                >
                  <MicOff className="w-5 h-5" />
                </Button>
              )}
              
              {/* Audio Visualizer */}
              {isConnected && (isSpeaking || isListening) && (
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <div className={`w-full h-full rounded-full ${
                    isSpeaking ? 'bg-green-500' : 'bg-blue-500'
                  } animate-pulse`} />
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">
              💡 Essayez: "Trouve-moi un resto italien" • "Mes préférences" • "Réserve une table"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatInterface;