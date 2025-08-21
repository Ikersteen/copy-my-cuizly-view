-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for restaurant images
CREATE POLICY "Restaurant owners can upload their images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can view their images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can update their images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can delete their images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view public restaurant images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');

-- Add logo_url field to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS logo_url TEXT;