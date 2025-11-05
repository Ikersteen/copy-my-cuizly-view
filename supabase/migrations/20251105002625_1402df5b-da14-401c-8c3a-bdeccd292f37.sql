-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for chat image uploads
CREATE POLICY "Authenticated users can upload their chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own chat images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own chat images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-images' AND
  auth.uid() IS NOT NULL
);