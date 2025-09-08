ALTER TABLE public.restaurants 
ADD COLUMN service_types text[] DEFAULT '{}';

COMMENT ON COLUMN public.restaurants.service_types IS 'Types de services offerts par le restaurant';