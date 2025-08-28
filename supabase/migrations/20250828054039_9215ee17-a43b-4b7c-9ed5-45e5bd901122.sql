-- SÉCURITÉ CRITIQUE: Corriger l'exposition des données personnelles des profils

-- 1. Créer une fonction sécurisée pour obtenir les noms publics des utilisateurs
CREATE OR REPLACE FUNCTION public.get_public_user_names(user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  -- SÉCURITÉ: Cette fonction retourne UNIQUEMENT les noms d'affichage, 
  -- PAS les numéros de téléphone ou autres données sensibles
$$;

-- 2. Renforcer les politiques RLS pour s'assurer qu'aucun accès public n'est possible
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Bloquer tout accès anonyme/public à la table profiles
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);

-- 4. S'assurer que toutes les autres opérations restent sécurisées
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile only" ON public.profiles;
CREATE POLICY "Users can delete own profile only" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);