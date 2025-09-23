import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type?: 'text' | 'audio' | 'system';
  audio_url?: string;
  transcription?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title?: string;
  type: string; // Changé pour accepter n'importe quel string de la DB
  created_at: string;
  updated_at: string;
  user_id?: string;
  messages?: ConversationMessage[];
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Charger toutes les conversations
  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations((data || []).map(conv => ({
        ...conv,
        type: conv.type as string
      })));
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle conversation
  const createConversation = async (type: 'voice' | 'text' = 'voice', title?: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour sauvegarder",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: session.user.id,
          type,
          title: title || `Conversation ${type === 'voice' ? 'vocale' : 'texte'} - ${new Date().toLocaleDateString('fr-FR')}`
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadConversations();
      setCurrentConversation({
        ...data,
        type: data.type as string
      });
      
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  // Sauvegarder un message
  const saveMessage = async (
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageType: 'text' | 'audio' | 'system' = 'text',
    audioUrl?: string,
    transcription?: string
  ) => {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          message_type: messageType,
          audio_url: audioUrl,
          transcription: transcription
        });

      if (error) throw error;
      
      // Recharger la conversation courante si c'est celle-ci
      if (currentConversation?.id === conversationId) {
        await loadConversationMessages(conversationId);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le message",
        variant: "destructive",
      });
    }
  };

  // Charger les messages d'une conversation
  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const conversation = { 
        ...conversationData, 
        type: conversationData.type as string,
        messages: (messages || []).map(msg => ({
          ...msg,
          role: msg.role as 'user' | 'assistant' | 'system',
          message_type: msg.message_type as 'text' | 'audio' | 'system'
        }))
      };
      setCurrentConversation(conversation);
      return conversation;
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
      return null;
    }
  };

  // Supprimer une conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      
      await loadConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      
      toast({
        title: "Succès",
        description: "Conversation supprimée",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation",
        variant: "destructive",
      });
    }
  };

  // Renommer une conversation
  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;
      
      await loadConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, title });
      }
      
      toast({
        title: "Succès",
        description: "Titre mis à jour",
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le titre",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return {
    conversations,
    currentConversation,
    loading,
    createConversation,
    saveMessage,
    loadConversationMessages,
    deleteConversation,
    updateConversationTitle,
    loadConversations,
    setCurrentConversation
  };
};