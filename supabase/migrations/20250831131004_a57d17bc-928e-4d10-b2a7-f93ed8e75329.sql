-- Migration finale : Correction des accès storage et configurations auth

-- 1. Corriger les politiques storage.objects pour restreindre l'accès anonyme
DROP POLICY IF EXISTS "Authenticated users can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can view their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can view their menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own comment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own comment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view comment images" ON storage.objects;

-- Créer des politiques sécurisées pour storage.objects
CREATE POLICY "Authenticated users can view restaurant images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Authenticated users can view comment images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'comment-images');

CREATE POLICY "Restaurant owners can upload their images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their comment images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Restaurant owners can update their images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their comment images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Restaurant owners can delete their images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their comment images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);