-- Créer la fonction get_public_restaurants pour permettre aux consommateurs de voir les restaurants
CREATE OR REPLACE FUNCTION get_public_restaurants()
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
  owner_id uuid
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
    owner_id
  FROM restaurants 
  WHERE is_active = true;
$$;