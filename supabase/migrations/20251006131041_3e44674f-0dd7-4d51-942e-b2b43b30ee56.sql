-- Ajouter avatar_url à la fonction get_public_user_names
CREATE OR REPLACE FUNCTION public.get_public_user_names(user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
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
    COALESCE(p.username, 'anonyme') as username,
    p.avatar_url
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
$$;