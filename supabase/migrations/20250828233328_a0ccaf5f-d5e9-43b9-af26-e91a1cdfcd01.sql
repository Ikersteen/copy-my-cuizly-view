-- Allow authenticated users to track analytics (profile views, menu views, etc.)
-- This enables the tracking functions to work for all authenticated users

-- Policy for all authenticated users to insert analytics data
DROP POLICY IF EXISTS "System can insert analytics data" ON restaurant_analytics;
CREATE POLICY "Authenticated users can track analytics" 
ON restaurant_analytics 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy for all authenticated users to update analytics data  
DROP POLICY IF EXISTS "System can update analytics data" ON restaurant_analytics;
CREATE POLICY "Authenticated users can update analytics"
ON restaurant_analytics 
FOR UPDATE 
TO authenticated 
USING (true);