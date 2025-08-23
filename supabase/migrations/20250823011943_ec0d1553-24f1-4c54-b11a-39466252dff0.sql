-- Ajouter le champ cuisine_type aux menus
ALTER TABLE public.menus ADD COLUMN cuisine_type text;

-- Ajouter le champ cuisine_type aux offres  
ALTER TABLE public.offers ADD COLUMN cuisine_type text;