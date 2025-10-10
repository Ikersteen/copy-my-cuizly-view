-- Corriger la fonction get_restaurant_by_slug pour gérer correctement les caractères spéciaux comme &
-- et utiliser la même approche que get_public_restaurants (LANGUAGE sql)

DROP FUNCTION IF EXISTS public.get_restaurant_by_slug(text);

-- Créer une fonction helper pour créer un slug à partir d'un nom
CREATE OR REPLACE FUNCTION public.create_restaurant_slug(restaurant_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN LOWER(
    TRIM(BOTH '-' FROM 
      REGEXP_REPLACE(
        TRANSLATE(
          restaurant_name,
          'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ& ',
          'aaaaaaeeeeiiiioooouuuuyyncAAAAAAEEEEIIIIOOOOUUUUYYNC'
        ),
        '[^a-z0-9]+', '-', 'g'
      )
    )
  );
END;
$$;

-- Recréer la fonction get_restaurant_by_slug en utilisant LANGUAGE sql pour bypasser les RLS
CREATE OR REPLACE FUNCTION public.get_restaurant_by_slug(restaurant_slug text)
RETURNS TABLE(
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
  delivery_radius integer,
  dietary_restrictions text[],
  allergens text[],
  restaurant_specialties text[],
  service_types text[],
  instagram_url text,
  facebook_url text,
  dress_code text,
  parking text,
  opening_hours jsonb,
  reservations_enabled boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  owner_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.name,
    r.description,
    r.description_fr,
    r.description_en,
    COALESCE(a.formatted_address, r.address) as address,
    r.phone,
    r.email,
    r.cuisine_type,
    r.price_range,
    r.logo_url,
    r.cover_image_url,
    r.delivery_radius,
    r.dietary_restrictions,
    r.allergens,
    r.restaurant_specialties,
    r.service_types,
    r.instagram_url,
    r.facebook_url,
    r.dress_code,
    r.parking,
    r.opening_hours,
    r.reservations_enabled,
    r.is_active,
    r.created_at,
    r.updated_at,
    r.owner_id
  FROM public.restaurants r
  LEFT JOIN public.addresses a ON r.owner_id = a.user_id 
    AND a.address_type = 'restaurant' 
    AND a.is_primary = true 
    AND a.is_active = true
  WHERE r.is_active = true
    AND public.create_restaurant_slug(r.name) = LOWER(restaurant_slug)
  LIMIT 1;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.get_restaurant_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_restaurant_by_slug(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_restaurant_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_restaurant_slug(text) TO authenticated;