-- Modifier les valeurs par défaut de la table user_preferences

-- Changer le rayon de livraison de 10 à 0
ALTER TABLE public.user_preferences 
ALTER COLUMN delivery_radius SET DEFAULT 0;

-- Changer les notifications pour désactiver push et email par défaut
ALTER TABLE public.user_preferences 
ALTER COLUMN notification_preferences SET DEFAULT '{"sms": false, "push": false, "email": false}'::jsonb;

-- Le price_range est déjà NULL par défaut, pas de modification nécessaire