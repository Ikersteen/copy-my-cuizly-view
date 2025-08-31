-- Correction finale : Politiques RLS sécurisées pour la table comment

-- 1. Table comment - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Only authenticated users can view active comments" ON public.comment;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comment;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comment;
DROP POLICY IF EXISTS "Authenticated users can create their own comments" ON public.comment;

CREATE POLICY "Only authenticated users can view active comments" 
ON public.comment FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Users can delete their own comments" 
ON public.comment FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comment FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own comments" 
ON public.comment FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);