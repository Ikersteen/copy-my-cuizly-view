-- Correction finale : Politiques RLS pour la table Comments (pluriel, majuscule)

-- 1. Table Comments - Corriger les politiques d'accès anonyme  
DROP POLICY IF EXISTS "Only authenticated users can view active comments" ON public.Comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.Comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.Comments;
DROP POLICY IF EXISTS "Authenticated users can create their own comments" ON public.Comments;

CREATE POLICY "Only authenticated users can view active comments" 
ON public.Comments FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Users can delete their own comments" 
ON public.Comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.Comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own comments" 
ON public.Comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);