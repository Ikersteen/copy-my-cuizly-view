-- Create addresses table for centralized address management
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  address_type text NOT NULL CHECK (address_type IN ('restaurant', 'user_delivery', 'user_billing')),
  street_number text,
  street_name text,
  apartment_unit text,
  neighborhood text,
  city text NOT NULL DEFAULT 'Montréal',
  province text NOT NULL DEFAULT 'QC',
  postal_code text,
  country text NOT NULL DEFAULT 'Canada',
  formatted_address text NOT NULL,
  latitude numeric,
  longitude numeric,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure only one primary address per type per user
  UNIQUE(user_id, address_type, is_primary) WHERE is_primary = true
);

-- Enable RLS on addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addresses
CREATE POLICY "Users can manage their own addresses" 
ON public.addresses 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_addresses_user_type ON public.addresses(user_id, address_type);
CREATE INDEX idx_addresses_active ON public.addresses(is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user's primary address by type
CREATE OR REPLACE FUNCTION get_user_primary_address(p_user_id uuid, p_address_type text)
RETURNS TABLE (
  id uuid,
  formatted_address text,
  street_number text,
  street_name text,
  apartment_unit text,
  neighborhood text,
  city text,
  province text,
  postal_code text,
  country text,
  latitude numeric,
  longitude numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.formatted_address,
    a.street_number,
    a.street_name,
    a.apartment_unit,
    a.neighborhood,
    a.city,
    a.province,
    a.postal_code,
    a.country,
    a.latitude,
    a.longitude
  FROM addresses a
  WHERE a.user_id = p_user_id 
    AND a.address_type = p_address_type 
    AND a.is_primary = true 
    AND a.is_active = true
  LIMIT 1;
END;
$$;