-- Add reservations_enabled column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN reservations_enabled boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.restaurants.reservations_enabled IS 'Allows restaurants to enable/disable the reservation system';

-- Update existing restaurants to have reservations disabled by default
UPDATE public.restaurants 
SET reservations_enabled = false 
WHERE reservations_enabled IS NULL;