-- Ajouter la colonne address à la table waitlist_analytics
ALTER TABLE public.waitlist_analytics 
ADD COLUMN address text;