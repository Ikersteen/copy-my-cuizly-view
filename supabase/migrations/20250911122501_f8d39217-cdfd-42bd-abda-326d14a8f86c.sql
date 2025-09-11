-- Check if restaurant-images bucket exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'restaurant-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'restaurant-images', 
      'restaurant-images', 
      true, 
      5242880, -- 5MB limit
      ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    );
  END IF;
END $$;

-- Create RLS policies for restaurant images
CREATE POLICY "Restaurant owners can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Restaurant images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Restaurant owners can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );