-- Fix security issue: Restrict profiles table access to authenticated users only
-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;

-- Create new restrictive policies that explicitly block anonymous access
CREATE POLICY "Users can insert own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE  
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for security completeness
CREATE POLICY "Users can delete own profile only"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure user_id column cannot be null to prevent security bypass
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;