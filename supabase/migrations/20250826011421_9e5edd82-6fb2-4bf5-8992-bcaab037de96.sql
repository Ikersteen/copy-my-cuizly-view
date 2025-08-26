-- Fix security issue: Update get_public_restaurants function to exclude sensitive contact information
-- This prevents harvesting of restaurant email addresses and phone numbers by spammers

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
  -- Note: email and phone are deliberately excluded to prevent contact information harvesting
$$;