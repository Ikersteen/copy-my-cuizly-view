-- Supprimer et recréer la fonction get_public_restaurants avec dress_code et parking
DROP FUNCTION IF EXISTS public.get_public_restaurants();

CREATE OR REPLACE FUNCTION public.get_public_restaurants()
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
   opening_hours jsonb, 
   delivery_radius integer, 
   is_active boolean, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   dietary_restrictions text[], 
   allergens text[], 
   restaurant_specialties text[], 
   service_types text[], 
   instagram_url text, 
   facebook_url text, 
   dress_code text,
   parking text,
   owner_id uuid
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    r.id, r.name, r.description, r.description_fr, r.description_en, 
    -- Récupérer l'adresse depuis la table addresses si disponible, sinon utiliser r.address
    COALESCE(a.formatted_address, r.address) as address,
    r.phone, r.email,
    r.cuisine_type, r.price_range, r.logo_url, r.cover_image_url, r.opening_hours,
    r.delivery_radius, r.is_active, r.created_at, r.updated_at, r.dietary_restrictions,
    r.allergens, r.restaurant_specialties, r.service_types, r.instagram_url, r.facebook_url,
    r.dress_code, r.parking,
    r.owner_id
  FROM restaurants r
  LEFT JOIN addresses a ON r.owner_id = a.user_id 
    AND a.address_type = 'restaurant' 
    AND a.is_primary = true 
    AND a.is_active = true
  WHERE r.is_active = true;
$function$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_public_restaurants() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_restaurants() TO authenticated;