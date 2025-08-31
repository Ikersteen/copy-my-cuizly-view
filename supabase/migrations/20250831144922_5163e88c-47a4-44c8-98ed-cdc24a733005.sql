-- Corriger les fonctions avec search_path mutable pour sécurité A+
-- Toutes les fonctions doivent avoir un search_path explicite pour éviter les attaques d'injection

-- Corriger les fonctions sans search_path
ALTER FUNCTION public.is_authenticated_user() SET search_path TO 'public';
ALTER FUNCTION public.allow_public_restaurant_data() SET search_path TO 'public';
ALTER FUNCTION public.log_unauthorized_access_attempt() SET search_path TO 'public';

-- Vérifier et corriger autres fonctions existantes si nécessaire
CREATE OR REPLACE FUNCTION public.validate_email_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Validation basique des domaines email autorisés
  RETURN email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
END;
$$;