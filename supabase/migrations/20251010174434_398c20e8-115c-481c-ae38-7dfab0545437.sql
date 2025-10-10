-- Fonction pour récupérer un restaurant par son slug (nom formaté)
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
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_slug text;
BEGIN
  -- Normaliser le slug pour la comparaison (minuscules, sans accents, tirets)
  normalized_slug := LOWER(
    TRANSLATE(
      restaurant_slug,
      'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ',
      'aaaaaaeeeeiiiioooouuuuyyncAAAAAAEEEEIIIIOOOOUUUUYYNC'
    )
  );
  
  -- Remplacer les espaces et caractères spéciaux par des tirets
  normalized_slug := REGEXP_REPLACE(normalized_slug, '[^a-z0-9]+', '-', 'g');
  
  -- Supprimer les tirets en début et fin
  normalized_slug := TRIM(BOTH '-' FROM normalized_slug);
  
  -- Chercher le restaurant dont le nom correspond au slug
  RETURN QUERY
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
    r.updated_at
  FROM public.restaurants r
  WHERE r.is_active = true
    AND LOWER(
      TRIM(BOTH '-' FROM 
        REGEXP_REPLACE(
          TRANSLATE(
            r.name,
            'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ',
            'aaaaaaeeeeiiiioooouuuuyyncAAAAAAEEEEIIIIOOOOUUUUYYNC'
          ),
          '[^a-z0-9]+', '-', 'g'
        )
      )
    ) = normalized_slug
  LIMIT 1;
END;
$$;