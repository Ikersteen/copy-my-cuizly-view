import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Settings, History, Send, User, Menu } from 'lucide-react';
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
  id: string;
  type: 'text' | 'audio';
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
}

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversations] = useState<Conversation[]>([
    { id: '1', title: 'Conversation précédente', lastMessage: new Date() }
  ]);

  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleMessage = (message: any) => {
    if (message.type === 'transcript' && message.text) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'text',
        content: message.text,
        role: message.role,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
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
  };

  const sendTextMessage = () => {
    if (!inputText.trim() || !isConnected) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: inputText,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: "Je comprends votre message. Comment puis-je vous aider davantage?",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const toggleRecording = () => {
    if (!isConnected) {
      startConversation();
      return;
    }
    setIsRecording(!isRecording);
  };

  const handleClose = () => {
    if (isConnected) {
      endConversation();
    }
    onClose();
  };

  // Header Component
  const Header = () => (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <img src={chefIconUrl} alt="Cuizly" className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Assistant Cuizly</h1>
          <p className="text-xs text-muted-foreground">
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      </div>
    </div>
  );

  // Sidebar Component
  const Sidebar = () => (
    <div className={cn(
      "absolute inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-200 lg:relative lg:translate-x-0",
      showSidebar ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="font-medium text-foreground mb-3">Historique</h2>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              setMessages([]);
              setShowSidebar(false);
            }}
          >
            Nouvelle conversation
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="text-sm font-medium text-foreground truncate">
                {conv.title}
              </div>
              <div className="text-xs text-muted-foreground">
                Il y a {Math.floor((Date.now() - conv.lastMessage.getTime()) / (1000 * 60 * 60))}h
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );

  // Message Component
  const MessageComponent = ({ message }: { message: Message }) => (
    <div className={cn(
      "flex gap-3 p-4 group",
      message.role === 'user' ? 'flex-row-reverse' : ''
    )}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
        {message.role === 'assistant' ? (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <img src={chefIconUrl} alt="AI" className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
        message.role === 'assistant'
          ? "bg-muted text-foreground"
          : "bg-primary text-primary-foreground"
      )}>
        {message.content}
      </div>
    </div>
  );

  // Audio Visualizer
  const AudioVisualizer = () => (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            (isSpeaking || isRecording) ? "bg-primary animate-pulse" : "bg-muted"
          )}
          style={{
            height: (isSpeaking || isRecording) ? `${Math.random() * 16 + 8}px` : '4px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  // Input Bar Component
  const InputBar = () => (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
      {showSettings && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
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
      
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tapez votre message..."
            className="pr-12 min-h-[44px] resize-none rounded-full"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTextMessage();
              }
            }}
            disabled={!isConnected}
          />
          {inputText && (
            <Button
              size="icon"
              onClick={sendTextMessage}
              className="absolute right-1 top-1 h-8 w-8 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Button
          size="icon"
          onClick={toggleRecording}
          className={cn(
            "h-11 w-11 rounded-full transition-all duration-200",
            isRecording || isSpeaking
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-primary hover:bg-primary/90"
          )}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      {(isSpeaking || isRecording) && (
        <div className="mt-3 flex justify-center">
          <AudioVisualizer />
        </div>
      )}
    </div>
  );

  // Main conversation area
  const ConversationArea = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <MessageComponent key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <img src={chefIconUrl} alt="Cuizly" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Bonjour ! Comment puis-je vous aider ?
              </h3>
              <p className="text-sm text-muted-foreground">
                Vous pouvez me parler ou m'écrire pour commencer une conversation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0 bg-background">
        <div className="flex h-full relative">
          <Sidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <ConversationArea />
            <InputBar />
          </div>
        </div>
        
        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAssistantModal;