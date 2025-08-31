-- Ajouter une colonne avatar_url à la table profiles pour stocker l'image de profil
ALTER TABLE public.profiles 
ADD COLUMN avatar_url text;

-- Créer un bucket de stockage pour les avatars utilisateurs
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Créer les politiques RLS pour le bucket avatars
-- Les utilisateurs peuvent voir tous les avatars publics
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Les utilisateurs peuvent uploader leur propre avatar
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);