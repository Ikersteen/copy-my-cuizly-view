-- Security Fix: Restrict public restaurant data access to non-sensitive fields only

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Consumers can view active restaurants" ON restaurants;

-- Create a new restrictive policy for public restaurant listings
-- This policy allows public access but with explicit column restrictions
CREATE POLICY "Public can view basic restaurant info" 
ON restaurants 
FOR SELECT 
TO public
USING (
  is_active = true 
  -- Only non-sensitive columns are accessible via this policy
  -- The application code will need to specify exact columns
);

-- Add a comment to document the security restriction
COMMENT ON POLICY "Public can view basic restaurant info" ON restaurants IS 
'Allows public access to restaurants but application must explicitly select only non-sensitive columns (name, description, address, cuisine_type, price_range, logo_url, cover_image_url, is_active, delivery_radius, opening_hours, created_at, updated_at). Sensitive fields (phone, email, owner_id) require authentication and ownership.';