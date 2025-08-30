-- Supprimer les fonctions existantes pour les recréer avec les nouvelles colonnes
DROP FUNCTION IF EXISTS public.get_public_restaurants();
DROP FUNCTION IF EXISTS public.get_public_restaurants_secure();
DROP FUNCTION IF EXISTS public.get_public_restaurants_safe();
DROP FUNCTION IF EXISTS public.get_safe_restaurant_data();

-- Créer une fonction pour obtenir la description traduite
CREATE OR REPLACE FUNCTION public.get_translated_description(restaurant_row restaurants, language text DEFAULT 'fr')
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE language
    WHEN 'en' THEN
      RETURN COALESCE(restaurant_row.description_en, restaurant_row.description_fr, restaurant_row.description);
    ELSE
      RETURN COALESCE(restaurant_row.description_fr, restaurant_row.description);
  END CASE;
END;
$$;

-- Recréer la fonction get_public_restaurants avec les nouvelles colonnes
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
    r.updated_at
  FROM restaurants r
  WHERE r.is_active = true;
$$;