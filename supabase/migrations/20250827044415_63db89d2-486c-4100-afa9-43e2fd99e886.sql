-- Fix RLS policies for user_favorites to ensure proper access
DROP POLICY IF EXISTS "Authenticated users can manage own favorites" ON public.user_favorites;

-- Create separate policies for each operation with clearer access control
CREATE POLICY "Users can view own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure the table has RLS enabled
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;