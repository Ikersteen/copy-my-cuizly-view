-- Supprimer la fonction existante avec une signature différente
DROP FUNCTION IF EXISTS get_public_restaurants();

-- Recréer la fonction avec tous les champs nécessaires
CREATE OR REPLACE FUNCTION get_public_restaurants()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  description_fr text,
  description_en text,
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
  owner_id uuid
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.id,
    r.name,
    r.description,
    r.description_fr,
    r.description_en,
    r.address,
    r.phone,
    r.email,
    r.cuisine_type,
    r.price_range,
    r.logo_url,
    r.cover_image_url,
    r.opening_hours,
    r.delivery_radius,
    r.is_active,
    r.created_at,
    r.updated_at,
    r.dietary_restrictions,
    r.allergens,
    r.restaurant_specialties,
    r.owner_id
  FROM restaurants r
  WHERE r.is_active = true;
$$;