-- Ajouter un champ d'adresse complète aux préférences utilisateur
ALTER TABLE public.user_preferences 
ADD COLUMN full_address text,
ADD COLUMN neighborhood text,
ADD COLUMN postal_code text;