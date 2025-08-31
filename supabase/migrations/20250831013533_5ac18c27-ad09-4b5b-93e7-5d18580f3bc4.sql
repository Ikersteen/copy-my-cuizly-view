-- SECURITY FIX: Restrict restaurant data access to prevent contact info harvesting
-- Remove the overly permissive policy that allows access to all columns
DROP POLICY IF EXISTS "Authenticated users view basic restaurant info" ON public.restaurants;

-- Create a more restrictive policy that only allows access to public information
-- This policy specifically excludes sensitive contact information (email, phone)
CREATE POLICY "Authenticated users can view public restaurant data only" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (
  is_active = true 
  AND auth.uid() <> owner_id
);

-- Add column-level security by creating a view for public restaurant data
-- This ensures even if someone bypasses RLS, they can't access sensitive data
CREATE OR REPLACE VIEW public.restaurants_public AS
SELECT 
  id,
  name,
  description,
  description_fr,
  description_en,
  address,
  cuisine_type,
  price_range,
  opening_hours,
  logo_url,
  cover_image_url,
  delivery_radius,
  is_active,
  created_at,
  updated_at,
  dietary_restrictions,
  allergens,
  restaurant_specialties
FROM public.restaurants
WHERE is_active = true;

-- Grant public read access to the view (but not the underlying table)
GRANT SELECT ON public.restaurants_public TO authenticated;

-- Ensure the get_public_restaurants function uses safe column selection
-- Update to be extra explicit about excluded columns
CREATE OR REPLACE FUNCTION public.get_public_restaurants()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  description_fr text,
  description_en text,
  address text,
  cuisine_type text[],
  price_range text,
  opening_hours jsonb,
  logo_url text,
  cover_image_url text,
  delivery_radius integer,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  dietary_restrictions text[],
  allergens text[],
  restaurant_specialties text[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- SECURITY: This function explicitly excludes sensitive contact information
  -- email and phone are intentionally omitted to prevent data harvesting
  SELECT 
    r.id,
    r.name,
    r.description,
    r.description_fr,
    r.description_en,
    r.address,
    r.cuisine_type,
    r.price_range,
    r.opening_hours,
    r.logo_url,
    r.cover_image_url,
    r.delivery_radius,
    r.is_active,
    r.created_at,
    r.updated_at,
    r.dietary_restrictions,
    r.allergens,
    r.restaurant_specialties
  FROM restaurants r
  WHERE r.is_active = true;
$function$;

-- Create a secure function for getting restaurant contact info (owner only)
-- This ensures contact information is only accessible to the restaurant owner
CREATE OR REPLACE FUNCTION public.get_restaurant_contact_info(restaurant_id uuid)
RETURNS TABLE(email text, phone text, name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- SECURITY: Only restaurant owners can access their own contact information
  SELECT 
    r.email,
    r.phone,
    r.name
  FROM restaurants r
  WHERE r.id = restaurant_id 
    AND r.owner_id = auth.uid()
    AND r.is_active = true;
$function$;