-- Fix storage RLS policies for restaurant-images bucket
-- First, ensure storage.objects policies exist for the restaurant-images bucket

-- Policy to allow authenticated users to insert their own files
CREATE POLICY "Users can upload their own restaurant images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to view all restaurant images
CREATE POLICY "Anyone can view restaurant images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');

-- Policy to allow users to update their own images
CREATE POLICY "Users can update their own restaurant images"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own images
CREATE POLICY "Users can delete their own restaurant images"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);