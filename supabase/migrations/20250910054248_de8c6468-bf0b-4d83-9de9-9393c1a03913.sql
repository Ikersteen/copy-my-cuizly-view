-- Create storage bucket for restaurant cover photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-covers', 'restaurant-covers', true);

-- Create RLS policies for restaurant cover photos
CREATE POLICY "Restaurant owners can view cover photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-covers');

CREATE POLICY "Restaurant owners can upload their cover photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can update their cover photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant owners can delete their cover photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add cover_photo field to restaurant_profiles table
ALTER TABLE public.restaurant_profiles 
ADD COLUMN cover_photo TEXT;