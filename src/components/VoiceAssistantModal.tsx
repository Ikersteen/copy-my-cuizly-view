import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Send, User, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations] = useState<Conversation[]>([
    { id: '1', title: 'Conversation précédente', lastMessage: new Date() }
  ]);

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

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Je comprends votre message. Comment puis-je vous aider davantage avec vos besoins culinaires?",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
          <p className="text-xs text-muted-foreground">Chat en ligne</p>
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

  // Loading Component
  const LoadingMessage = () => (
    <div className="flex gap-3 p-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <img src={chefIconUrl} alt="AI" className="w-4 h-4" />
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );

  // Input Bar Component
  const InputBar = () => (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
      {showSettings && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Paramètres</h3>
            <p className="text-xs text-muted-foreground">
              Interface de chat optimisée pour vos questions culinaires
            </p>
          </div>
        </div>
      )}
      
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Posez votre question culinaire..."
            className="pr-12 min-h-[44px] resize-none rounded-full"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTextMessage();
              }
            }}
            disabled={isLoading}
          />
          {inputText && (
            <Button
              size="icon"
              onClick={sendTextMessage}
              disabled={isLoading}
              className="absolute right-1 top-1 h-8 w-8 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
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
          {isLoading && <LoadingMessage />}
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
                Posez-moi vos questions sur la cuisine, les recettes ou les restaurants à Montréal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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