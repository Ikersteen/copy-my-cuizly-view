-- Add table configuration columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS number_of_tables integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS reservation_turnover_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_reservation_duration_minutes integer DEFAULT 120;

COMMENT ON COLUMN public.restaurants.number_of_tables IS 'Total number of tables available for reservations';
COMMENT ON COLUMN public.restaurants.reservation_turnover_minutes IS 'Time in minutes between reservation slots (turnover time)';
COMMENT ON COLUMN public.restaurants.max_reservation_duration_minutes IS 'Maximum duration in minutes for a single reservation';