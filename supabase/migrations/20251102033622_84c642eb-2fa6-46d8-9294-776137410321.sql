-- Ajouter le rôle admin aux propriétaires de restaurants existants
-- Vous pouvez modifier cette requête pour n'ajouter que votre propre email

-- Ajouter le rôle admin à un utilisateur spécifique (remplacez l'email si nécessaire)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE email = 'monsieurcafe&vins@gmail.com' -- Remplacez par votre email
ON CONFLICT (user_id, role) DO NOTHING;

-- OU, pour ajouter le rôle admin à TOUS les propriétaires de restaurants:
-- Décommentez les lignes suivantes si vous voulez donner accès admin à tous les restos
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT user_id, 'admin'::app_role
-- FROM public.profiles
-- WHERE user_type = 'restaurant_owner'
-- ON CONFLICT (user_id, role) DO NOTHING;