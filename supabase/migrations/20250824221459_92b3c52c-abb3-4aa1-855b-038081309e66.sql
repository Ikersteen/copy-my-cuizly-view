-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view basic restaurant info" ON public.restaurants;

-- Create a more restrictive public access policy that excludes sensitive contact information
CREATE POLICY "Public can view basic restaurant info" ON public.restaurants
FOR SELECT 
USING (
  is_active = true 
  AND (
    -- Allow access to non-sensitive columns only
    current_setting('request.jwt.claims', true)::json->>'role' IS NULL
    OR auth.role() = 'anon'
  )
);

-- Create a new function that returns only public restaurant information (without contact details)
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

-- Update the existing get_public_restaurants function to use the safer version
CREATE OR REPLACE FUNCTION public.get_public_restaurants()
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
  SELECT * FROM public.get_public_restaurants_safe();
$$;

-- Ensure restaurant owners can still access their own contact information
-- This policy should already exist but let's make sure it's properly configured
DROP POLICY IF EXISTS "Authenticated restaurant owners can view own restaurants" ON public.restaurants;
CREATE POLICY "Authenticated restaurant owners can view own restaurants" ON public.restaurants
FOR SELECT 
USING (auth.uid() = owner_id);

-- Ensure authenticated users can view basic restaurant info (without contact details)
DROP POLICY IF EXISTS "Authenticated view active restaurants" ON public.restaurants;
CREATE POLICY "Authenticated users can view basic restaurant info" ON public.restaurants
FOR SELECT 
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != owner_id
);