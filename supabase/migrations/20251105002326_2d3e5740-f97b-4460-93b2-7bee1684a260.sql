-- Create storage bucket for chat documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-documents', 'chat-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for chat document uploads
CREATE POLICY "Authenticated users can upload their chat documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own chat documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own chat documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own chat documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-documents' AND
  auth.uid() IS NOT NULL
);