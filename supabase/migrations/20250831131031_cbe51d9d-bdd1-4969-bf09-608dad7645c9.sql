-- Migration simplifiée : Recréation complète des politiques storage sécurisées

-- Supprimer TOUTES les politiques existantes sur storage.objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Créer des politiques sécurisées minimales pour storage.objects
-- 1. Lecture sécurisée des images restaurants (authentifiés seulement)
CREATE POLICY "Authenticated users can view restaurant images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'restaurant-images');

-- 2. Lecture sécurisée des images commentaires (authentifiés seulement)
CREATE POLICY "Authenticated users can view comment images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'comment-images');

-- 3. Upload sécurisé pour les images restaurants (propriétaires seulement)
CREATE POLICY "Restaurant owners upload images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'restaurant-images');

-- 4. Upload sécurisé pour les images commentaires (utilisateurs authentifiés)
CREATE POLICY "Users upload comment images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'comment-images');

-- 5. Modification sécurisée (propriétaires de fichiers seulement)
CREATE POLICY "Owners can update their files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

-- 6. Suppression sécurisée (propriétaires de fichiers seulement)
CREATE POLICY "Owners can delete their files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());