-- Add dietary restrictions and allergens columns to menus table
ALTER TABLE public.menus 
ADD COLUMN dietary_restrictions text[] DEFAULT '{}',
ADD COLUMN allergens text[] DEFAULT '{}';