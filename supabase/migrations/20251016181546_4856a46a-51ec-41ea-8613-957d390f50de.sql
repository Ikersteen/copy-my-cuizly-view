-- Supprimer et recréer la fonction get_public_restaurants avec les champs manquants
DROP FUNCTION IF EXISTS public.get_public_restaurants();

CREATE OR REPLACE FUNCTION public.get_public_restaurants()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  phone text,
  email text,
  cuisine_type text[],
  price_range text,
  logo_url text,
  cover_image_url text,
  opening_hours jsonb,
  delivery_radius integer,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  dietary_restrictions text[],
  allergens text[],
  restaurant_specialties text[],
  description_fr text,
  description_en text,
  owner_id uuid,
  service_types text[],
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  dress_code text,
  parking text,
  reservations_enabled boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    id,
    name,
    description,
    address,
    phone,
    email,
    cuisine_type,
    price_range,
    logo_url,
    cover_image_url,
    opening_hours,
    delivery_radius,
    is_active,
    created_at,
    updated_at,
    dietary_restrictions,
    allergens,
    restaurant_specialties,
    description_fr,
    description_en,
    owner_id,
    service_types,
    instagram_url,
    facebook_url,
    tiktok_url,
    dress_code,
    parking,
    reservations_enabled
  FROM restaurants 
  WHERE is_active = true;
$$;