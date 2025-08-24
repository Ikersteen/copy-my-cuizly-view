-- Create RLS policies for restaurant-images bucket to allow restaurant owners to upload images

-- Policy for restaurant owners to upload their menu images
CREATE POLICY "Restaurant owners can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM restaurants 
    WHERE owner_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy for restaurant owners to view their uploaded images
CREATE POLICY "Restaurant owners can view their menu images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM restaurants 
    WHERE owner_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy for restaurant owners to update their menu images
CREATE POLICY "Restaurant owners can update their menu images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM restaurants 
    WHERE owner_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy for restaurant owners to delete their menu images
CREATE POLICY "Restaurant owners can delete their menu images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM restaurants 
    WHERE owner_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy to allow public viewing of menu images (for public display)
CREATE POLICY "Public can view menu images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');