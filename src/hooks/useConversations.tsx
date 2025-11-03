import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type?: 'text' | 'audio' | 'system';
  audio_url?: string;
  transcription?: string;
  image_url?: string;
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
  const { t } = useTranslation();

  // Charger toutes les conversations
  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let query = supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      // Filtrer selon le type d'utilisateur
      if (session?.user) {
        // Utilisateur connecté : filtrer par user_id
        query = query.eq('user_id', session.user.id);
      } else {
        // Utilisateur anonyme : filtrer par anonymous_session_id
        const anonymousSessionId = getAnonymousSessionId();
        query = query
          .is('user_id', null)
          .eq('anonymous_session_id', anonymousSessionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations((data || []).map(conv => ({
        ...conv,
        type: conv.type as string
      })));
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.cannotLoadConversations'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Générer ou récupérer l'ID de session anonyme
  const getAnonymousSessionId = (): string => {
    let sessionId = localStorage.getItem('cuizly_anonymous_session_id');
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('cuizly_anonymous_session_id', sessionId);
    }
    return sessionId;
  };

  // Créer une nouvelle conversation (supporte les utilisateurs anonymes)
  const createConversation = async (type: 'voice' | 'text' = 'voice', title?: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Pour les utilisateurs anonymes
      if (!session?.user) {
        const anonymousSessionId = getAnonymousSessionId();
        
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_id: null,
            anonymous_session_id: anonymousSessionId,
            type,
            title: title || `Conversation anonyme - ${new Date().toLocaleDateString('fr-FR')}`
          })
          .select()
          .single();

        if (error) throw error;
        
        setCurrentConversation({
          ...data,
          type: data.type as string
        });
        
        return data.id;
      }

      // Pour les utilisateurs connectés
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: session.user.id,
          anonymous_session_id: null,
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
        title: t('errors.title'),
        description: t('errors.cannotCreateConversation'),
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
    transcription?: string,
    imageUrl?: string
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
          transcription: transcription,
          image_url: imageUrl
        });

      if (error) throw error;
      
      // Mettre à jour le timestamp de la conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      // Recharger la conversation courante si c'est celle-ci
      if (currentConversation?.id === conversationId) {
        await loadConversationMessages(conversationId);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.cannotSaveMessage'),
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
        title: t('errors.title'),
        description: t('errors.cannotLoadMessages'),
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
        title: t('toasts.success'),
        description: t('toasts.conversationDeleted'),
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.cannotDeleteConversation'),
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
        title: t('toasts.success'),
        description: t('toasts.titleUpdated'),
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.cannotUpdateTitle'),
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
    setCurrentConversation,
    getAnonymousSessionId
  };
};