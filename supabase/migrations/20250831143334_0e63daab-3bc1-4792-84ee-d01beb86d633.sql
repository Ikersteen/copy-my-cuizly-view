-- Fix: Remove RLS policy from view (not supported) and improve security

-- Drop the invalid RLS policy on the view
DROP POLICY IF EXISTS "Anyone can view public restaurant data via view" ON public.restaurants_public;

-- Views cannot have RLS policies in PostgreSQL
-- Remove the security barrier setting from the view as well
DROP VIEW IF EXISTS public.restaurants_public;

-- Recreate the view as a simple view without RLS attempts
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

-- Grant SELECT permission on the view to authenticated users
GRANT SELECT ON public.restaurants_public TO authenticated;

-- The main security is enforced through:
-- 1. The restrictive RLS policy on restaurants table
-- 2. The get_public_restaurants() function for safe access
-- 3. This view as an additional read-only option