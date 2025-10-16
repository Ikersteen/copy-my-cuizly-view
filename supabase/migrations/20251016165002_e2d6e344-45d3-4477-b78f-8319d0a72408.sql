-- Add TikTok URL column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN tiktok_url text;