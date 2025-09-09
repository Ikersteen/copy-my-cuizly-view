-- Add Instagram and Facebook links to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN instagram_url text,
ADD COLUMN facebook_url text;