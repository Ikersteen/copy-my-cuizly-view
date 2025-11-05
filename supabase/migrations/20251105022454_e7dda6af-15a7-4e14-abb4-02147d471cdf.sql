-- Créer les buckets s'ils n'existent pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-documents', 'chat-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow public uploads for chat images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to chat images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads for chat documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to chat documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own chat documents" ON storage.objects;

-- Politiques pour chat-images
CREATE POLICY "Allow public uploads for chat images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Allow public access to chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

CREATE POLICY "Allow users to delete their own chat images"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'chat-images' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
);

-- Politiques pour chat-documents
CREATE POLICY "Allow public uploads for chat documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'chat-documents');

CREATE POLICY "Allow public access to chat documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-documents');

CREATE POLICY "Allow users to delete their own chat documents"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'chat-documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'anonymous')
);