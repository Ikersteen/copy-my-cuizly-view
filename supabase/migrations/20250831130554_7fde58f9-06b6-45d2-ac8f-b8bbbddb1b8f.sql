-- CORRECTION SÉCURISÉE : Ajout de la restriction TO authenticated seulement
-- Pas de DROP/CREATE mais modification des politiques existantes

-- 1. Corriger la politique SELECT sur Comments
DROP POLICY "Only authenticated users can view active comments" ON public.Comments;
CREATE POLICY "Only authenticated users can view active comments" 
ON public.Comments FOR SELECT 
TO authenticated 
USING (is_active = true);

-- 2. Corriger la politique INSERT sur Comments  
DROP POLICY "Authenticated users can create their own comments" ON public.Comments;
CREATE POLICY "Authenticated users can create their own comments" 
ON public.Comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Corriger la politique UPDATE sur Comments
DROP POLICY "Users can update their own comments" ON public.Comments;
CREATE POLICY "Users can update their own comments" 
ON public.Comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Corriger la politique DELETE sur Comments
DROP POLICY "Users can delete their own comments" ON public.Comments;
CREATE POLICY "Users can delete their own comments" 
ON public.Comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);