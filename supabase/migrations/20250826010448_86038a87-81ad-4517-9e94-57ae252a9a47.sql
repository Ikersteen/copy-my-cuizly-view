-- Fix security issue: Add RLS policies to restaurants_public view
-- This view should only show public restaurant information for active restaurants

-- Enable RLS on the restaurants_public view
ALTER TABLE public.restaurants_public ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to active restaurant information
-- This matches the intent of the view - showing public restaurant data
CREATE POLICY "Public restaurants are viewable by everyone" 
ON public.restaurants_public 
FOR SELECT 
USING (is_active = true);

-- Ensure the view only shows truly public information by excluding sensitive data
-- Drop and recreate the view to exclude sensitive contact information
DROP VIEW IF EXISTS public.restaurants_public;

CREATE VIEW public.restaurants_public AS
SELECT 
  id,
  name,
  description,
  address,
  cuisine_type,
  price_range,
  opening_hours,
  logo_url,
  cover_image_url,
  delivery_radius,
  is_active,
  created_at,
  updated_at
FROM public.restaurants
WHERE is_active = true;