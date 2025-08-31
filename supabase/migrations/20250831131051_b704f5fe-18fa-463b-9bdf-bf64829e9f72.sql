-- Migration ultra-simplifiée : Politiques storage minimales sécurisées

-- Supprimer seulement les politiques publiques problématiques
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;

-- Créer des politiques sécurisées minimales
CREATE POLICY "Auth users view restaurant images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Auth users view comment images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'comment-images');