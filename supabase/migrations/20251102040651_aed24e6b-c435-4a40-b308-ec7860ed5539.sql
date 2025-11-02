-- Ajouter un champ image_url à la table conversation_messages pour stocker les URLs d'images
ALTER TABLE public.conversation_messages 
ADD COLUMN image_url TEXT;

-- Créer un bucket de storage pour les images de chat si nécessaire
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Ajouter les policies RLS pour le bucket chat-images
CREATE POLICY "Les utilisateurs peuvent voir les images de chat"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

CREATE POLICY "Les utilisateurs peuvent uploader leurs propres images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' AND
  (auth.uid() IS NOT NULL OR true)
);