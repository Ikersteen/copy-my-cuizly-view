-- SECURITY FIX: Remove all anonymous access policies and ensure authenticated-only access

-- Fix remaining anonymous access policies
DROP POLICY IF EXISTS "Anyone can view active menus" ON public.menus;
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;

-- Ensure all policies target authenticated users only
-- Ratings policies (already fixed, but ensure consistency)
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.ratings;
CREATE POLICY "Authenticated users can view ratings" 
ON public.ratings 
FOR SELECT 
TO authenticated
USING (true);

-- Menu policies (ensure authenticated access only)
CREATE POLICY "Authenticated users can view active menus" 
ON public.menus 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Offer policies (ensure authenticated access only)  
CREATE POLICY "Authenticated users can view active offers" 
ON public.offers 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Fix profile policies to be explicit about authentication
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix user preferences policies
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;

CREATE POLICY "Authenticated users can create own preferences" 
ON public.user_preferences 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own preferences" 
ON public.user_preferences 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own preferences" 
ON public.user_preferences 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own preferences" 
ON public.user_preferences 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix user favorites policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites;

CREATE POLICY "Authenticated users can manage own favorites" 
ON public.user_favorites 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

-- Fix orders policies
DROP POLICY IF EXISTS "Restaurant owners can update their restaurant orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurant orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Authenticated restaurant owners can update orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

CREATE POLICY "Authenticated restaurant owners can view orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

CREATE POLICY "Authenticated users can create own orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix restaurant analytics policies
DROP POLICY IF EXISTS "Restaurant owners can view their analytics" ON public.restaurant_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON public.restaurant_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON public.restaurant_analytics;

CREATE POLICY "Authenticated restaurant owners can view analytics" 
ON public.restaurant_analytics 
FOR SELECT 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

-- Keep system policies but make them more secure
CREATE POLICY "Service role can insert analytics" 
ON public.restaurant_analytics 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update analytics" 
ON public.restaurant_analytics 
FOR UPDATE 
TO service_role
USING (true);

-- Fix restaurants policies
DROP POLICY IF EXISTS "Restaurant owners can create their own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can delete their own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update their own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their own restaurants" ON public.restaurants;

CREATE POLICY "Authenticated restaurant owners can create restaurants" 
ON public.restaurants 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Authenticated restaurant owners can delete restaurants" 
ON public.restaurants 
FOR DELETE 
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated restaurant owners can update restaurants" 
ON public.restaurants 
FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated restaurant owners can view own restaurants" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (auth.uid() = owner_id);