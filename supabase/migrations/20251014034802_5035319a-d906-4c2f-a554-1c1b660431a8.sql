-- Create restaurant_holidays table
CREATE TABLE IF NOT EXISTS public.restaurant_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  holiday_name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  country TEXT NOT NULL DEFAULT 'Canada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_holidays ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can manage their own holidays
CREATE POLICY "Restaurant owners can manage holidays"
ON public.restaurant_holidays
FOR ALL
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

-- Policy: Public can view holidays for active restaurants
CREATE POLICY "Public can view holidays"
ON public.restaurant_holidays
FOR SELECT
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE is_active = true
  )
);

-- Create index for performance
CREATE INDEX idx_restaurant_holidays_restaurant_id ON public.restaurant_holidays(restaurant_id);
CREATE INDEX idx_restaurant_holidays_date ON public.restaurant_holidays(holiday_date);

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_holidays_updated_at
  BEFORE UPDATE ON public.restaurant_holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reservations_updated_at();

-- Insert default Canadian/Quebec holidays for 2026
-- Note: These will be templates that restaurants can enable/disable
INSERT INTO public.restaurant_holidays (restaurant_id, holiday_name, holiday_date, is_enabled, is_recurring, country)
SELECT 
  r.id,
  unnest(ARRAY[
    'New Year''s Day',
    'Good Friday',
    'Easter Monday',
    'Victoria Day',
    'Canada Day',
    'Civic Holiday',
    'Labour Day',
    'National Day for Truth and Reconciliation',
    'Thanksgiving',
    'Remembrance Day',
    'Christmas Day',
    'Boxing Day'
  ]),
  unnest(ARRAY[
    '2026-01-01'::date,
    '2026-04-03'::date,
    '2026-04-06'::date,
    '2026-05-18'::date,
    '2026-07-01'::date,
    '2026-08-03'::date,
    '2026-09-07'::date,
    '2026-09-30'::date,
    '2026-10-12'::date,
    '2026-11-11'::date,
    '2026-12-25'::date,
    '2026-12-26'::date
  ]),
  false, -- disabled by default, restaurant owner must enable
  true,
  'Canada'
FROM public.restaurants r
ON CONFLICT DO NOTHING;