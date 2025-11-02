-- Créer des politiques pour permettre aux admins de voir toutes les conversations et messages

-- Politique pour que les admins puissent voir toutes les conversations (y compris anonymes)
CREATE POLICY "Admins can view all conversations" 
ON public.conversations 
FOR SELECT 
USING (public.is_admin());

-- Politique pour que les admins puissent voir tous les messages
CREATE POLICY "Admins can view all messages" 
ON public.conversation_messages 
FOR SELECT 
USING (public.is_admin());

-- Créer une fonction pour récupérer toutes les conversations avec leurs messages (pour les admins)
CREATE OR REPLACE FUNCTION public.get_all_conversations_with_messages(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  conversation_id uuid,
  conversation_title text,
  conversation_type text,
  conversation_created_at timestamp with time zone,
  user_id uuid,
  anonymous_session_id text,
  message_id uuid,
  message_role text,
  message_content text,
  message_type text,
  message_created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.title as conversation_title,
    c.type as conversation_type,
    c.created_at as conversation_created_at,
    c.user_id,
    c.anonymous_session_id,
    cm.id as message_id,
    cm.role as message_role,
    cm.content as message_content,
    cm.message_type,
    cm.created_at as message_created_at
  FROM public.conversations c
  LEFT JOIN public.conversation_messages cm ON c.id = cm.conversation_id
  ORDER BY c.created_at DESC, cm.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Créer une fonction pour compter les conversations anonymes vs connectées
CREATE OR REPLACE FUNCTION public.get_conversation_stats()
RETURNS TABLE(
  total_conversations bigint,
  anonymous_conversations bigint,
  authenticated_conversations bigint,
  total_messages bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT CASE WHEN c.user_id IS NULL THEN c.id END) as anonymous_conversations,
    COUNT(DISTINCT CASE WHEN c.user_id IS NOT NULL THEN c.id END) as authenticated_conversations,
    COUNT(cm.id) as total_messages
  FROM public.conversations c
  LEFT JOIN public.conversation_messages cm ON c.id = cm.conversation_id;
END;
$$;