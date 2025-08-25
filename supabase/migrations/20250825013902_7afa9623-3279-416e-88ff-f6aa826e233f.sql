-- Créer la table des commentaires avec photos
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  comment_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  images TEXT[], -- Array d'URLs d'images
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les commentaires
CREATE POLICY "Authenticated users can view active comments" 
ON public.comments 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can create their own comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer un bucket pour les images de commentaires
INSERT INTO storage.buckets (id, name, public) VALUES ('comment-images', 'comment-images', true);

-- Politiques pour le stockage des images de commentaires
CREATE POLICY "Users can view comment images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'comment-images');

CREATE POLICY "Users can upload their own comment images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own comment images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own comment images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);