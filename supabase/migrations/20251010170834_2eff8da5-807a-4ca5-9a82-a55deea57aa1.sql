-- Add dress_code and parking fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN dress_code TEXT,
ADD COLUMN parking TEXT;

COMMENT ON COLUMN public.restaurants.dress_code IS 'Dress code requirements for the restaurant';
COMMENT ON COLUMN public.restaurants.parking IS 'Parking information and availability';