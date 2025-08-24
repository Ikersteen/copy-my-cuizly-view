-- Add delivery_radius column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS delivery_radius INTEGER DEFAULT 5;