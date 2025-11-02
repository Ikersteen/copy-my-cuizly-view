-- Modifier les politiques RLS pour conversation_messages pour supporter les utilisateurs anonymes

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.conversation_messages;

-- Créer de nouvelles politiques qui supportent les sessions anonymes
CREATE POLICY "Users can create messages in their conversations" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (
      -- Utilisateur connecté
      (conversations.user_id = auth.uid() AND auth.uid() IS NOT NULL)
      OR
      -- Session anonyme
      (conversations.user_id IS NULL AND conversations.anonymous_session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Users can view messages from their conversations" 
ON public.conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (
      -- Utilisateur connecté
      (conversations.user_id = auth.uid() AND auth.uid() IS NOT NULL)
      OR
      -- Session anonyme
      (conversations.user_id IS NULL AND conversations.anonymous_session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Users can update messages in their conversations" 
ON public.conversation_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (
      -- Utilisateur connecté
      (conversations.user_id = auth.uid() AND auth.uid() IS NOT NULL)
      OR
      -- Session anonyme
      (conversations.user_id IS NULL AND conversations.anonymous_session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Users can delete messages in their conversations" 
ON public.conversation_messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = conversation_messages.conversation_id
    AND (
      -- Utilisateur connecté
      (conversations.user_id = auth.uid() AND auth.uid() IS NOT NULL)
      OR
      -- Session anonyme
      (conversations.user_id IS NULL AND conversations.anonymous_session_id IS NOT NULL)
    )
  )
);