import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { supabase } from '@/integrations/supabase/client';

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
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
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
        title: t('voiceAssistant.errors.connectionFailed'),
        description: t('voiceAssistant.errors.notConnected'),
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      voiceClientRef.current = new RealtimeVoiceClient(handleMessage);
      await voiceClientRef.current.connect();
      
      setIsConnected(true);
      setMessages([{
        type: 'system',
        text: '🎙️ Assistant vocal activé - Parlez maintenant!',
        role: 'system',
        timestamp: new Date()
      }]);
      
      toast({
        title: t('voiceAssistant.connected'),
        description: t('voiceAssistant.available'),
      });
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      toast({
        title: t('voiceAssistant.errors.connectionFailed'),
        description: t('errors.general'),
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
    setMessages(prev => [...prev, {
      type: 'system',
      text: t('voiceAssistant.conversationEnded'),
      role: 'system',
      timestamp: new Date()
    }]);
  };

  const handleClose = () => {
    if (isConnected) {
      endConversation();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎙️ {t('voiceAssistant.modalTitle')}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Audio Visualizer */}
          <div className="flex justify-center items-center h-32 bg-background/50 rounded-lg border-2 border-dashed border-border">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    isSpeaking ? 'bg-cuizly-primary animate-pulse' : 'bg-cuizly-neutral'
                  }`} />
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    isSpeaking ? 'bg-cuizly-primary animate-pulse' : 'bg-cuizly-neutral/60'
                  }`} style={{ animationDelay: '0.1s' }} />
                  <div className={`w-2 h-2 rounded-full transition-all duration-700 ${
                    isSpeaking ? 'bg-cuizly-primary animate-pulse' : 'bg-cuizly-neutral/40'
                  }`} style={{ animationDelay: '0.2s' }} />
                </>
              ) : (
                <div className="text-cuizly-neutral text-sm">
                  {isConnecting ? t('voiceAssistant.connecting') : t('voiceAssistant.readyToConnect')}
                </div>
              )}
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex justify-center">
            {!isConnected ? (
              <Button 
                onClick={startConversation}
                disabled={isConnecting}
                className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t('voiceAssistant.connecting')}
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    {t('voiceAssistant.startConversation')}
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={endConversation}
                variant="secondary"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <MicOff className="w-4 h-4 mr-2" />
                {t('voiceAssistant.endConversation')}
              </Button>
            )}
          </div>

          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 bg-muted/30 rounded-lg p-3">
              {messages.map((message, index) => (
                <div key={index} className={`text-sm ${
                  message.role === 'system' 
                    ? 'text-cuizly-neutral text-center italic' 
                    : message.role === 'assistant'
                    ? 'text-cuizly-primary font-medium'
                    : 'text-foreground'
                }`}>
                  {message.role === 'assistant' && '🤖 '}
                  {message.role === 'user' && '👤 '}
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-cuizly-neutral text-center space-y-1">
            <p>💡 <strong>{t('voiceAssistant.instructions.try')}</strong> {t('voiceAssistant.instructions.examples')}</p>
            <p>🎯 {t('voiceAssistant.instructions.capabilities')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAssistantModal;