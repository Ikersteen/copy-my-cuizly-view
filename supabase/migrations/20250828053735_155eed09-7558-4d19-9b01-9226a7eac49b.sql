-- SÉCURITÉ CRITIQUE: Corriger les problèmes d'exposition des données de contact des restaurants

-- 1. Supprimer les politiques potentiellement problématiques
DROP POLICY IF EXISTS "Authenticated users can view public restaurant info via view" ON public.restaurants;

-- 2. Créer une politique stricte qui bloque tout accès public direct à la table restaurants
CREATE POLICY "Block all direct public access to restaurants table" 
ON public.restaurants 
FOR SELECT 
USING (false);

-- 3. S'assurer que seuls les propriétaires peuvent voir leurs propres données complètes
DROP POLICY IF EXISTS "Restaurant owners can view their own full restaurant info" ON public.restaurants;
CREATE POLICY "Restaurant owners can view their own restaurants only" 
ON public.restaurants 
FOR SELECT 
USING (auth.uid() = owner_id);

-- 4. Créer une fonction publique strictement contrôlée pour les données publiques uniquement
CREATE OR REPLACE FUNCTION public.get_safe_restaurant_data()
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
  -- CRITIQUE: email et phone sont délibérément exclus pour éviter le harvesting
$$;

-- 5. Mettre à jour la fonction existante pour être identique et sécurisée
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
  -- SÉCURITÉ: Les champs email et phone ne sont jamais exposés publiquement
$$;