import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, MessageSquare, Volume2, VolumeX, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  isPartial?: boolean;
}

interface HybridChatInterfaceProps {
  onClose?: () => void;
}

const HybridChatInterface: React.FC<HybridChatInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessage = (message: any) => {
    if (message.type === 'transcript') {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        
        // If it's a partial message from assistant, update the last message
        if (message.isPartial && message.role === 'assistant' && 
            lastMessage?.type === 'assistant' && lastMessage.isPartial) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + message.text
          };
          return updated;
        }
        
        // Create new message
        return [...prev, {
          id: Date.now().toString(),
          type: message.role,
          content: message.text,
          timestamp: message.timestamp,
          isVoice: true,
          isPartial: message.isPartial
        }];
      });
    }
  };

  const startVoiceConversation = async () => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour utiliser la conversation vocale",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      
      voiceClientRef.current = new RealtimeVoiceClient(
        handleMessage,
        setIsConnected,
        setIsSpeaking
      );
      
      await voiceClientRef.current.init(currentUserId);
      setIsVoiceMode(true);
      
      // Add welcome message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Conversation vocale démarrée. Vous pouvez maintenant parler naturellement avec Cuizly !',
        timestamp: new Date(),
        isVoice: true
      }]);
      
      toast({
        title: "Connecté",
        description: "Conversation vocale active. Parlez naturellement !",
      });
    } catch (error) {
      console.error('Error starting voice conversation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Impossible de démarrer la conversation vocale',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endVoiceConversation = () => {
    voiceClientRef.current?.disconnect();
    voiceClientRef.current = null;
    setIsVoiceMode(false);
    setIsConnected(false);
    setIsSpeaking(false);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: 'Conversation vocale terminée.',
      timestamp: new Date()
    }]);
  };

  const sendTextMessage = async () => {
    if (!textInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textInput.trim(),
      timestamp: new Date(),
      isVoice: false
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput('');

    try {
      // Use existing voice chat function for consistency
      const { data, error } = await supabase.functions.invoke('cuizly-voice-chat', {
        body: {
          message: userMessage.content,
          userId: currentUserId,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.message,
        timestamp: new Date(),
        isVoice: false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="Cuizly" />
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Cuizly Assistant</h2>
            <p className="text-sm text-muted-foreground">
              {isVoiceMode 
                ? (isConnected ? 'Conversation vocale active' : 'Connexion...')
                : 'Chat textuel'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <Button
            variant={isVoiceMode ? "default" : "outline"}
            size="sm"
            onClick={isVoiceMode ? endVoiceConversation : startVoiceConversation}
            disabled={isConnecting}
          >
            {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isVoiceMode ? 'Vocal' : 'Texte'}
          </Button>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Voice Status Indicator */}
      {isVoiceMode && (
        <div className="p-3 bg-primary/5 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isSpeaking ? 'bg-green-500 animate-pulse' : 
              isConnected ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm">
              {isSpeaking ? 'Cuizly parle...' :
               isConnected ? 'Prêt à vous écouter' : 'Connexion...'}
            </span>
            {isSpeaking && <Volume2 className="w-4 h-4 text-green-500" />}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">🍽️</div>
              <h3 className="font-semibold mb-2">Bonjour ! Je suis Cuizly</h3>
              <p className="text-muted-foreground mb-4">
                Votre assistant culinaire IA pour découvrir les meilleurs restaurants de Montréal.
              </p>
              <p className="text-sm text-muted-foreground">
                {isVoiceMode 
                  ? "Parlez naturellement, je vous écoute !"
                  : "Tapez votre message ou passez en mode vocal pour une conversation naturelle."
                }
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type !== 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg" alt="Cuizly" />
                  <AvatarFallback>C</AvatarFallback>
                </Avatar>
              )}
              
              <Card className={`max-w-xs lg:max-w-md p-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.type === 'system'
                  ? 'bg-muted'
                  : 'bg-card'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.isVoice && (
                    <Volume2 className="w-3 h-3 opacity-70" />
                  )}
                </div>
              </Card>
              
              {message.type === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Text Input (only in text mode) */}
      {!isVoiceMode && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1"
            />
            <Button onClick={sendTextMessage} disabled={!textInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridChatInterface;