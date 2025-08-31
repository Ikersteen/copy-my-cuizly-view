-- Fix Security Definer View issue: Convert table-returning functions to SECURITY INVOKER

-- 1. Fix get_public_restaurants function - convert to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_public_restaurants()
RETURNS TABLE(id uuid, name text, description text, description_fr text, description_en text, address text, cuisine_type text[], price_range text, opening_hours jsonb, logo_url text, cover_image_url text, delivery_radius integer, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, dietary_restrictions text[], allergens text[], restaurant_specialties text[])
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path = 'public'
AS $$
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
$$;

-- 2. Fix get_public_user_names function - convert to SECURITY INVOKER 
CREATE OR REPLACE FUNCTION public.get_public_user_names(user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, username text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT 
    p.user_id,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
      THEN CONCAT(p.first_name, ' ', p.last_name)
      WHEN p.first_name IS NOT NULL 
      THEN p.first_name
      WHEN p.username IS NOT NULL 
      THEN p.username
      ELSE 'Utilisateur anonyme'
    END as display_name,
    COALESCE(p.username, 'anonyme') as username
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
  -- SECURITY: This function returns ONLY public display names, 
  -- NOT phone numbers or other sensitive data
$$;

-- 3. Keep get_restaurant_contact_info as SECURITY DEFINER since it needs to bypass RLS for owners
-- This one is properly secured and only returns data to restaurant owners