-- Fix security issue: Restrict comments access to authenticated users only
-- This prevents unauthenticated users from seeing user_id fields in comments

-- Drop the existing policy that allows unauthenticated access
DROP POLICY IF EXISTS "Authenticated users can view active comments" ON public.comments;

-- Create new policy that requires authentication to view comments
CREATE POLICY "Only authenticated users can view active comments" 
ON public.comments 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Ensure the policy is properly applied
COMMENT ON POLICY "Only authenticated users can view active comments" ON public.comments IS 
'Restricts comment viewing to authenticated users only to prevent user ID exposure and potential stalking/harassment';