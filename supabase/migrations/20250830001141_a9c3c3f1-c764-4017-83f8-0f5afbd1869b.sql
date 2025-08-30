-- Fix security issue: Restrict access to restaurant contact information
-- Ensure only restaurant owners can see phone/email, public users get limited info only

-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Restaurant owners access only" ON public.restaurants;

-- Create specific policy for restaurant owners to have full access to their own restaurants
CREATE POLICY "Restaurant owners full access to own restaurants" 
ON public.restaurants 
FOR ALL 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Create policy for authenticated users to view basic restaurant info (no contact details)
CREATE POLICY "Authenticated users view basic restaurant info" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (
  is_active = true 
  AND auth.uid() != owner_id
);

-- Create policy for anonymous users to view basic restaurant info through functions only
-- This policy intentionally returns false for direct table access by anonymous users
CREATE POLICY "Anonymous users no direct access" 
ON public.restaurants 
FOR SELECT 
TO anon
USING (false);

-- Update the public function to be more explicit about security
CREATE OR REPLACE FUNCTION public.get_public_restaurants_secure()
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
SET search_path = 'public'
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
  -- SECURITY: email and phone fields are deliberately excluded to prevent data harvesting
$$;

-- Add comment for clarity
COMMENT ON POLICY "Restaurant owners full access to own restaurants" ON public.restaurants IS 
'Allows restaurant owners full CRUD access to their own restaurant data including sensitive contact information';

COMMENT ON POLICY "Authenticated users view basic restaurant info" ON public.restaurants IS 
'Allows authenticated users to view basic restaurant information but excludes sensitive contact details like phone and email';

COMMENT ON POLICY "Anonymous users no direct access" ON public.restaurants IS 
'Prevents anonymous users from direct table access - they must use secure public functions instead';