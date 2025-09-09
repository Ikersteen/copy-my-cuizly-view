-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-images', 'restaurant-images', true);

-- Create RLS policies for restaurant images storage
CREATE POLICY "Restaurant owners can upload their own images"
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Restaurant owners can update their own images"
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Restaurant owners can delete their own images"
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view restaurant images"
ON storage.objects
FOR SELECT 
USING (bucket_id = 'restaurant-images');

-- Add helper function to upload restaurant images
CREATE OR REPLACE FUNCTION public.upload_restaurant_image(
  p_image_type text, -- 'logo' or 'cover'
  p_image_url text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  restaurant_id uuid;
  update_field text;
BEGIN
  -- Get current user
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get restaurant ID for this owner
  SELECT id INTO restaurant_id
  FROM restaurants 
  WHERE owner_id = user_id;

  IF restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found for this owner';
  END IF;

  -- Determine which field to update
  IF p_image_type = 'logo' THEN
    update_field := 'logo_url';
  ELSIF p_image_type = 'cover' THEN
    update_field := 'cover_image_url';
  ELSE
    RAISE EXCEPTION 'Invalid image type. Must be "logo" or "cover"';
  END IF;

  -- Update restaurant with new image URL
  EXECUTE format('UPDATE restaurants SET %I = $1, updated_at = now() WHERE id = $2', update_field)
  USING p_image_url, restaurant_id;

  RETURN p_image_url;
END;
$$;