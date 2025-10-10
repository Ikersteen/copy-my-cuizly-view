-- Create reservation status enum
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
  status reservation_status NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Create restaurant availability table
CREATE TABLE public.restaurant_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slot TIME NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week, time_slot)
);

-- Create indexes for better performance
CREATE INDEX idx_reservations_restaurant ON public.reservations(restaurant_id);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_availability_restaurant ON public.restaurant_availability(restaurant_id);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations
CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view their reservations"
  ON public.reservations FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update their reservations"
  ON public.reservations FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for availability
CREATE POLICY "Anyone can view availability"
  ON public.restaurant_availability FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage availability"
  ON public.restaurant_availability FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reservations_updated_at();

-- Function to check availability
CREATE OR REPLACE FUNCTION public.check_reservation_availability(
  p_restaurant_id UUID,
  p_date DATE,
  p_time TIME,
  p_party_size INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_num INTEGER;
  max_capacity INTEGER;
  current_bookings INTEGER;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  day_num := EXTRACT(DOW FROM p_date);
  
  -- Get max capacity for this time slot
  SELECT ra.max_capacity INTO max_capacity
  FROM public.restaurant_availability ra
  WHERE ra.restaurant_id = p_restaurant_id
    AND ra.day_of_week = day_num
    AND ra.time_slot = p_time
    AND ra.is_available = true;
  
  -- If no availability slot found, return false
  IF max_capacity IS NULL THEN
    RETURN false;
  END IF;
  
  -- Count current bookings for this time slot
  SELECT COALESCE(SUM(party_size), 0) INTO current_bookings
  FROM public.reservations
  WHERE restaurant_id = p_restaurant_id
    AND reservation_date = p_date
    AND reservation_time = p_time
    AND status IN ('pending', 'confirmed');
  
  -- Check if there's enough capacity
  RETURN (current_bookings + p_party_size) <= max_capacity;
END;
$$;

-- Function to get available time slots
CREATE OR REPLACE FUNCTION public.get_available_time_slots(
  p_restaurant_id UUID,
  p_date DATE,
  p_party_size INTEGER
)
RETURNS TABLE(time_slot TIME, available_spots INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_num INTEGER;
BEGIN
  day_num := EXTRACT(DOW FROM p_date);
  
  RETURN QUERY
  SELECT 
    ra.time_slot,
    (ra.max_capacity - COALESCE(
      (SELECT SUM(r.party_size)
       FROM public.reservations r
       WHERE r.restaurant_id = p_restaurant_id
         AND r.reservation_date = p_date
         AND r.reservation_time = ra.time_slot
         AND r.status IN ('pending', 'confirmed')), 
      0
    ))::INTEGER as available_spots
  FROM public.restaurant_availability ra
  WHERE ra.restaurant_id = p_restaurant_id
    AND ra.day_of_week = day_num
    AND ra.is_available = true
    AND (ra.max_capacity - COALESCE(
      (SELECT SUM(r.party_size)
       FROM public.reservations r
       WHERE r.restaurant_id = p_restaurant_id
         AND r.reservation_date = p_date
         AND r.reservation_time = ra.time_slot
         AND r.status IN ('pending', 'confirmed')), 
      0
    )) >= p_party_size
  ORDER BY ra.time_slot;
END;
$$;