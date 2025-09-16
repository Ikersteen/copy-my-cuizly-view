import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Volume2, VolumeX, Send, Square, Keyboard, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import TypewriterRichText from "./TypewriterRichText";
import RichTextRenderer from "./RichTextRenderer";
import ThinkingIndicator from "./ThinkingIndicator";
import { RealtimeVoiceClient } from '../utils/RealtimeVoiceClient';
import { useConversations } from "@/hooks/useConversations";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageActions } from "./MessageActions";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useConversations";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  isProcessing?: boolean;
  isTyping?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBookmarked?: boolean;
}

interface VoiceChatInterfaceProps {
  onClose?: () => void;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Conversation management
  const { 
    conversations, 
    currentConversation, 
    createConversation, 
    saveMessage, 
    loadConversationMessages,
    setCurrentConversation 
  } = useConversations();
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [shouldStopTyping, setShouldStopTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceDetectionRef = useRef<any>(null);
  const realtimeClientRef = useRef<RealtimeVoiceClient | null>(null);

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

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadConversationMessages(currentConversation.id).then((conversationData) => {
        if (conversationData?.messages) {
          const formattedMessages: Message[] = conversationData.messages.map(msg => ({
            id: msg.id,
            type: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isAudio: msg.message_type === 'audio',
            isProcessing: false,
            isTyping: false
          }));
          setMessages(formattedMessages);
        }
      });
    } else {
      setMessages([]);
    }
  }, [currentConversation, loadConversationMessages]);

  // Handle realtime voice messages
  const handleRealtimeMessage = (event: any) => {
    console.log('Realtime event:', event);
    
    switch (event.type) {
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
      case 'response.audio.done':
        setIsSpeaking(false);
        if (isConversationActive && !isRecording) {
          setTimeout(() => {
            if (realtimeClientRef.current?.getConnectionStatus()) {
              setIsRecording(true);
            }
          }, 500);
        }
        break;
      case 'response.audio_transcript.delta':
        if (event.delta) {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isTyping) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + event.delta }
              ];
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  content: event.delta,
                  type: 'assistant',
                  timestamp: new Date(),
                  isAudio: true,
                  isProcessing: false,
                  isTyping: true,
                }
              ];
            }
          });
        }
        break;
      case 'response.audio_transcript.done':
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && lastMessage.isTyping) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, isTyping: false }
            ];
          }
          return prev;
        });
        break;
    }
  };

  // Save message to database
  const saveMessageToDb = async (role: 'user' | 'assistant', content: string, messageType: 'text' | 'audio' = 'text', audioUrl?: string, transcription?: string) => {
    if (!currentConversation || !userId) return;
    
    try {
      await saveMessage(
        currentConversation.id,
        role,
        content,
        messageType,
        audioUrl,
        transcription
      );
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Create new conversation
  const handleNewConversation = async () => {
    if (!userId) return;
    
    try {
      const conversationId = await createConversation(inputMode, `Nouvelle conversation ${inputMode}`);
      if (conversationId) {
        // createConversation already sets the current conversation in the hook
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Select conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setSidebarOpen(false);
  };

  // Message actions
  const handleMessageAction = (messageId: string, action: 'like' | 'dislike' | 'bookmark') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        switch (action) {
          case 'like':
            return { ...msg, isLiked: !msg.isLiked, isDisliked: false };
          case 'dislike':
            return { ...msg, isDisliked: !msg.isDisliked, isLiked: false };
          case 'bookmark':
            return { ...msg, isBookmarked: !msg.isBookmarked };
          default:
            return msg;
        }
      }
      return msg;
    }));
  };

  // Voice processing
  const processTextInput = async (text: string) => {
    if (!text.trim()) return;
    
    // Create conversation if none exists
    if (!currentConversation) {
      await handleNewConversation();
    }
    
    setIsProcessing(true);
    const controller = new AbortController();
    setAbortController(controller);
    
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: text,
      timestamp: new Date(),
      isAudio: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message
    await saveMessageToDb('user', text, 'text');

    try {
      if (realtimeClientRef.current?.getConnectionStatus()) {
        await realtimeClientRef.current.sendMessage(text);
        setIsProcessing(false);
        return;
      }

      setIsThinking(true);

      const chatResponse = await supabase.functions.invoke('cuizly-voice-chat', {
        body: { 
          message: text,
          userId,
          conversationHistory: messages.slice(-5)
        }
      });

      if (controller.signal.aborted) return;

      if (chatResponse.error) throw new Error('AI processing failed');

      const aiResponse = chatResponse.data?.response;
      if (!aiResponse) throw new Error('No AI response');

      setIsThinking(false);
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save assistant message
      await saveMessageToDb('assistant', aiResponse, 'text');

    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Error processing text:', error);
      setIsThinking(false);
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      processTextInput(textInput);
      setTextInput('');
    }
  };

  const hasTypingMessage = messages.some(msg => msg.isTyping);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 border-r border-border bg-muted/30">
        <ConversationSidebar
          currentConversation={currentConversation}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 h-16 border-b border-border bg-background px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ConversationSidebar
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              isMobile={true}
            />
            <div>
              <h1 className="font-semibold text-lg">
                {currentConversation?.title || 'Nouvelle conversation'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Assistant Cuizly
              </p>
            </div>
          </div>
          
          {/* Input Mode Toggle */}
          <div className="flex bg-muted rounded-full p-1">
            <Button
              variant={inputMode === 'voice' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setInputMode('voice')}
              className="rounded-full px-3"
            >
              <Mic className="w-4 h-4 mr-1" />
              Vocal
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setInputMode('text')}
              className="rounded-full px-3"
            >
              <Keyboard className="w-4 h-4 mr-1" />
              Texte
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <img 
                src="/lovable-uploads/64c3c5b4-0bea-428d-8a44-3f25301da946.png" 
                alt="Cuizly Assistant"
                className="h-16 w-auto block dark:hidden"
              />
              <img 
                src="/lovable-uploads/0f8fb1c9-af76-4fbc-8cec-9dc5fd10dc99.png" 
                alt="Cuizly Assistant"
                className="h-16 w-auto hidden dark:block brightness-125"
              />
              <div className="space-y-3 max-w-lg">
                <h2 className="text-xl font-semibold">Bienvenue sur Cuizly Assistant</h2>
                <p className="text-muted-foreground">
                  Commencez une conversation pour découvrir les meilleurs restaurants près de vous
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "group flex",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "flex items-start gap-3 max-w-[80%]",
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {message.type === 'assistant' ? (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      C
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "rounded-2xl px-4 py-3 relative",
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground ml-8' 
                      : 'bg-muted mr-8',
                    message.isProcessing && 'animate-pulse'
                  )}>
                    {message.isTyping && message.type === 'assistant' ? (
                      <TypewriterRichText 
                        text={message.content}
                        speed={20}
                        shouldStop={shouldStopTyping}
                        onComplete={() => {
                          setMessages(prev => prev.map(msg => 
                            msg.id === message.id 
                              ? { ...msg, isTyping: false }
                              : msg
                          ));
                        }}
                      />
                    ) : (
                      <RichTextRenderer 
                        content={message.content}
                      />
                    )}
                    
                    {/* Message Actions - only for assistant messages */}
                    {message.type === 'assistant' && !message.isTyping && !message.isProcessing && (
                      <div className="absolute -bottom-2 right-4">
                        <MessageActions
                          messageId={message.id}
                          content={message.content}
                          isLiked={message.isLiked}
                          isDisliked={message.isDisliked}
                          isBookmarked={message.isBookmarked}
                          onLike={() => handleMessageAction(message.id, 'like')}
                          onDislike={() => handleMessageAction(message.id, 'dislike')}
                          onBookmark={() => handleMessageAction(message.id, 'bookmark')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    C
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted mr-8">
                  <ThinkingIndicator />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-background p-4">
          {inputMode === 'voice' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Mode vocal activé - Cliquez sur le microphone pour parler
                </p>
              </div>
              <Button
                onClick={() => {/* Voice functionality to be implemented */}}
                disabled={isProcessing}
                className="w-16 h-16 rounded-full"
                variant="default"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : isRecording ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="flex gap-3">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Écrivez votre message à Cuizly..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                type={isProcessing || isThinking || hasTypingMessage ? "button" : "submit"}
                disabled={(!isProcessing && !isThinking && !hasTypingMessage) && !textInput.trim()}
                className="px-6"
              >
                {isProcessing || isThinking || hasTypingMessage ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-border">
          <p className="text-center text-xs text-muted-foreground">
            Cuizly peut parfois se tromper, pensez à vérifier les infos importantes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatInterface;