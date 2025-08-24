-- Remove the problematic view
DROP VIEW IF EXISTS public.restaurants_public;

-- Remove the anonymous access policy completely for better security
DROP POLICY IF EXISTS "Anonymous users can view basic restaurant info" ON public.restaurants;

-- Only allow authenticated users and restaurant owners to access restaurant data directly
-- Anonymous users will need to use the public function instead

-- The existing policies for restaurant owners and authenticated users are sufficient:
-- "Authenticated restaurant owners can view own restaurants" 
-- "Authenticated users can view basic restaurant info"

-- The public function get_public_restaurants_safe() will be the only way for anonymous users
-- to access restaurant data, and it only returns non-sensitive columns

-- Ensure the public function has proper security
CREATE OR REPLACE FUNCTION public.get_public_restaurants_safe()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  address text,
  cuisine_type text[],
  price_range text,
  opening_hours jsonb,
  logo_url text,
  cover_image_url text,
  delivery_radius integer,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id,
    r.name,
    r.description,
    r.address,
    r.cuisine_type,
    r.price_range,
    r.opening_hours,
    r.logo_url,
    r.cover_image_url,
    r.delivery_radius,
    r.is_active,
    r.created_at,
    r.updated_at
  FROM restaurants r
  WHERE r.is_active = true;
$$;

-- Grant execute permission to anonymous users for the function
GRANT EXECUTE ON FUNCTION public.get_public_restaurants_safe() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_restaurants() TO anon;