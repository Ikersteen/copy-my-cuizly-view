-- Add restaurant_specialties column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN restaurant_specialties TEXT[] DEFAULT '{}'::text[];