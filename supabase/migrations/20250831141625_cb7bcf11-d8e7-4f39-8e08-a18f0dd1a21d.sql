-- SÉCURITÉ CRITIQUE: Correction de la faille d'exposition des informations de contact

-- Supprimer la politique dangereuse qui expose les informations de contact
DROP POLICY IF EXISTS "Authenticated users can view public restaurant data only" ON public.restaurants;

-- Créer une nouvelle politique plus restrictive pour les données publiques
-- Cette politique bloque complètement l'accès direct SELECT pour les non-propriétaires
-- Les utilisateurs devront utiliser la fonction get_public_restaurants() qui exclut les champs sensibles
CREATE POLICY "Public access blocked - use get_public_restaurants function"
ON public.restaurants
FOR SELECT
TO authenticated
USING (false); -- Bloque complètement l'accès direct

-- Note: Les propriétaires gardent l'accès complet via la politique existante:
-- "Restaurant owners full access to own restaurants" avec (auth.uid() = owner_id)

-- Créer une vue publique sécurisée comme alternative (optionnel)
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

-- Activer RLS sur la vue
ALTER VIEW public.restaurants_public SET (security_barrier = true);

-- Politique pour la vue publique
CREATE POLICY "Anyone can view public restaurant data via view"
ON public.restaurants_public
FOR SELECT
TO authenticated
USING (true);

-- Fonction d'audit pour détecter les tentatives d'accès non autorisées
CREATE OR REPLACE FUNCTION public.audit_restaurant_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log tentative d'accès direct à la table restaurants
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'direct_restaurant_access_attempt',
      jsonb_build_object(
        'table', 'restaurants',
        'operation', TG_OP,
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
  END IF;
  
  RETURN NULL; -- Pour un trigger AFTER SELECT, on retourne NULL
END;
$$;