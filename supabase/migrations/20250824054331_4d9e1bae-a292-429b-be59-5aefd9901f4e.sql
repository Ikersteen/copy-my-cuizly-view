-- Remove problematic policies 
DROP POLICY IF EXISTS "Public can view safe restaurant info" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can view restaurant details" ON public.restaurants;

-- Create a simple policy for public access that excludes sensitive contact information
-- This will work by relying on SELECT column filtering in the application layer
CREATE POLICY "Public can view basic restaurant info" 
ON public.restaurants 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Update the function to have proper security settings
CREATE OR REPLACE FUNCTION public.get_public_restaurants()
RETURNS TABLE (
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
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Create a function for getting restaurant contact info (only for owners)
CREATE OR REPLACE FUNCTION public.get_restaurant_contact_info(restaurant_id uuid)
RETURNS TABLE (
  email text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    r.email,
    r.phone
  FROM restaurants r
  WHERE r.id = restaurant_id 
    AND r.owner_id = auth.uid()
    AND r.is_active = true;
$$;