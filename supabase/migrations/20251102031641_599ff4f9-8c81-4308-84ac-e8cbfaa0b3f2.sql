-- Permettre les conversations anonymes
ALTER TABLE public.conversations 
ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter une colonne pour identifier les sessions anonymes
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS anonymous_session_id text;

-- Créer un index pour les sessions anonymes
CREATE INDEX IF NOT EXISTS idx_conversations_anonymous_session 
ON public.conversations(anonymous_session_id);

-- Modifier les RLS policies pour permettre les insertions anonymes
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
CREATE POLICY "Users can create their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Permettre aux utilisateurs anonymes de voir leurs propres conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Permettre aux utilisateurs anonymes de mettre à jour leurs conversations
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Permettre aux utilisateurs anonymes de supprimer leurs conversations
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Créer une table pour le tracking de localisation anonyme
CREATE TABLE IF NOT EXISTS public.anonymous_location_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_accessed text NOT NULL,
  latitude numeric,
  longitude numeric,
  city text,
  country text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index pour la recherche par session
CREATE INDEX IF NOT EXISTS idx_anonymous_tracking_session 
ON public.anonymous_location_tracking(session_id);

-- Index pour la recherche par date
CREATE INDEX IF NOT EXISTS idx_anonymous_tracking_date 
ON public.anonymous_location_tracking(created_at);

-- RLS pour la table de tracking (admins seulement pour la lecture)
ALTER TABLE public.anonymous_location_tracking ENABLE ROW LEVEL SECURITY;

-- Permettre les insertions publiques (pour le tracking)
CREATE POLICY "Allow public insert for tracking" 
ON public.anonymous_location_tracking 
FOR INSERT 
WITH CHECK (true);

-- Seuls les admins peuvent lire
CREATE POLICY "Only admins can view tracking data" 
ON public.anonymous_location_tracking 
FOR SELECT 
USING (public.is_admin());

-- Fonction pour enregistrer le tracking de localisation
CREATE OR REPLACE FUNCTION public.track_anonymous_location(
  p_session_id text,
  p_page_accessed text,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tracking_id uuid;
BEGIN
  INSERT INTO public.anonymous_location_tracking (
    session_id,
    page_accessed,
    latitude,
    longitude,
    city,
    country,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_session_id,
    p_page_accessed,
    p_latitude,
    p_longitude,
    p_city,
    p_country,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_metadata
  ) RETURNING id INTO tracking_id;
  
  RETURN tracking_id;
END;
$$;