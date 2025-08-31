-- Fix the last Security Definer View issue: Convert get_restaurant_contact_info to SECURITY INVOKER

CREATE OR REPLACE FUNCTION public.get_restaurant_contact_info(restaurant_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT 
    r.email,
    r.phone
  FROM restaurants r
  WHERE r.id = restaurant_id 
    AND r.owner_id = auth.uid()
    AND r.is_active = true;
$$;

-- Note: This function can now use SECURITY INVOKER because:
-- 1. Restaurant owners have full access to their own restaurants via RLS policy
-- 2. The WHERE clause ensures only owners can access their restaurant's contact info
-- 3. This eliminates the security risk while maintaining functionality