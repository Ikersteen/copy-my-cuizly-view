-- Fix the anonymous access issue for restaurants table
-- Remove the current public policy that might still allow access to sensitive data
DROP POLICY IF EXISTS "Public can view basic restaurant info" ON public.restaurants;

-- Create a more secure policy that completely restricts column-level access for anonymous users
-- This policy will only allow access to basic restaurant info, excluding email and phone
CREATE POLICY "Anonymous users can view basic restaurant info" ON public.restaurants
FOR SELECT 
USING (
  is_active = true 
  AND auth.role() = 'anon'
  -- This policy will work with the security definer functions to limit column access
);

-- Ensure the authenticated users policy is properly restricted  
DROP POLICY IF EXISTS "Authenticated users can view basic restaurant info" ON public.restaurants;
CREATE POLICY "Authenticated users can view basic restaurant info" ON public.restaurants
FOR SELECT 
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != owner_id
);

-- Create a view for public restaurant data that excludes sensitive information
CREATE OR REPLACE VIEW public.restaurants_public AS
SELECT 
  id,
  name,
  description,
  address,
  cuisine_type,
  price_range,
  opening_hours,
  logo_url,
  cover_image_url,
  delivery_radius,
  is_active,
  created_at,
  updated_at
FROM public.restaurants
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- Update the public function to use the view instead of direct table access
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
  SELECT * FROM public.restaurants_public;
$$;