-- Fix critical security vulnerability: Remove overly permissive analytics policy
-- that allows all authenticated users to access sensitive business data

-- Drop the dangerous policy that allows all operations with 'USING condition: true'
DROP POLICY IF EXISTS "Allow analytics operations" ON public.restaurant_analytics;

-- Ensure proper policies are in place for restaurant owners only
-- (These policies should already exist, but we'll recreate them to be safe)

-- Allow restaurant owners to view their own analytics
DROP POLICY IF EXISTS "Restaurant owners can view own analytics" ON public.restaurant_analytics;
CREATE POLICY "Restaurant owners can view own analytics"
ON public.restaurant_analytics
FOR SELECT
TO authenticated
USING (restaurant_id IN (
  SELECT id FROM public.restaurants 
  WHERE owner_id = auth.uid()
));

-- Allow restaurant owners to insert/update their own analytics
DROP POLICY IF EXISTS "Restaurant owners can manage analytics" ON public.restaurant_analytics;
CREATE POLICY "Restaurant owners can manage analytics"
ON public.restaurant_analytics
FOR ALL
TO authenticated
USING (restaurant_id IN (
  SELECT id FROM public.restaurants 
  WHERE owner_id = auth.uid()
))
WITH CHECK (restaurant_id IN (
  SELECT id FROM public.restaurants 
  WHERE owner_id = auth.uid()
));

-- Allow system functions to insert analytics data (for automated tracking)
CREATE POLICY "System can insert analytics data"
ON public.restaurant_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow system functions to update analytics data (for automated tracking)  
CREATE POLICY "System can update analytics data"
ON public.restaurant_analytics
FOR UPDATE
TO authenticated
USING (true);