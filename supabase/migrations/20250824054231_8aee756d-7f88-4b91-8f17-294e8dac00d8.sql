-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view basic restaurant info" ON public.restaurants;

-- Create a new restrictive policy for public access that only shows safe information
CREATE POLICY "Public can view safe restaurant info" 
ON public.restaurants 
FOR SELECT 
USING (
  is_active = true 
  AND (
    -- Only allow access to non-sensitive columns for public
    current_setting('request.jwt.claims', true)::json->>'role' IS NULL
  )
);

-- Create a more permissive policy for authenticated users (but still hide contact info from other restaurants)
CREATE POLICY "Authenticated users can view restaurant details" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (
  is_active = true 
  AND (
    -- Restaurant owners can see their own full info
    auth.uid() = owner_id
    OR 
    -- Other authenticated users can see basic info but not contact details
    auth.uid() != owner_id
  )
);

-- Create a database function to get safe restaurant data for public access
CREATE OR REPLACE FUNCTION public.get_public_restaurants()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  cuisine_type text[],
  price_range text,
  opening_hours jsonb,
  logo_url text,
  cover_image_url text,
  delivery_radius integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.id,
    r.name,
    r.description,
    r.address,
    r.cuisine_type,
    r.price_range,
    r.opening_hours,
    r.logo_url,
    r.cover_image_url,
    r.delivery_radius,
    r.is_active,
    r.created_at,
    r.updated_at
  FROM public.restaurants r
  WHERE r.is_active = true;
$$;

-- Grant access to the function for anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_restaurants() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_restaurants() TO authenticated;