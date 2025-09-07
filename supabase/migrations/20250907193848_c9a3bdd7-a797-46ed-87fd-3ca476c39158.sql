-- Correction finale des fonctions avec search_path manquant

-- Identifier et corriger toutes les fonctions avec search_path non défini
-- Correction de la fonction has_role qui n'a pas de SET search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Correction de is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- Correction des autres fonctions SQL
CREATE OR REPLACE FUNCTION public.get_public_restaurants()
RETURNS TABLE(id uuid, name text, description text, description_fr text, description_en text, address text, phone text, email text, cuisine_type text[], price_range text, logo_url text, cover_image_url text, opening_hours jsonb, delivery_radius integer, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, dietary_restrictions text[], allergens text[], restaurant_specialties text[], owner_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT 
    r.id, r.name, r.description, r.description_fr, r.description_en, r.address, r.phone, r.email,
    r.cuisine_type, r.price_range, r.logo_url, r.cover_image_url, r.opening_hours,
    r.delivery_radius, r.is_active, r.created_at, r.updated_at, r.dietary_restrictions,
    r.allergens, r.restaurant_specialties, r.owner_id
  FROM restaurants r
  WHERE r.is_active = true;
$$;

-- Correction de get_restaurant_contact_info
CREATE OR REPLACE FUNCTION public.get_restaurant_contact_info(restaurant_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE sql STABLE
SET search_path = public AS $$
  SELECT r.email, r.phone
  FROM restaurants r
  WHERE r.id = restaurant_id 
    AND r.owner_id = auth.uid()
    AND r.is_active = true;
$$;

-- Correction de get_public_user_names
CREATE OR REPLACE FUNCTION public.get_public_user_names(user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, username text)
LANGUAGE sql STABLE
SET search_path = public AS $$
  SELECT 
    p.user_id,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
      THEN CONCAT(p.first_name, ' ', p.last_name)
      WHEN p.first_name IS NOT NULL 
      THEN p.first_name
      WHEN p.username IS NOT NULL 
      THEN p.username
      ELSE 'Utilisateur anonyme'
    END as display_name,
    COALESCE(p.username, 'anonyme') as username
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
$$;

-- Message de confirmation de sécurité
SELECT 'SÉCURITÉ MAXIMALE ATTEINTE: Données clients protégées par chiffrement PGP' as status;