-- Fix the last Security Definer View issue by restructuring the contact info access

-- Convert get_restaurant_contact_info to SECURITY INVOKER
-- This works because restaurant owners have full access to their own restaurants via RLS
CREATE OR REPLACE FUNCTION public.get_restaurant_contact_info(restaurant_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path = 'public'
AS $$
  -- This now relies on RLS policy "Restaurant owners full access to own restaurants"
  -- which allows owners to SELECT all fields from their own restaurants
  SELECT 
    r.email,
    r.phone
  FROM restaurants r
  WHERE r.id = restaurant_id 
    AND r.owner_id = auth.uid()
    AND r.is_active = true;
$$;

-- Alternative: Since restaurant owners have full access via RLS, 
-- they can directly query the restaurants table for their contact info
-- This function is now just a convenience wrapper that relies on existing RLS policies