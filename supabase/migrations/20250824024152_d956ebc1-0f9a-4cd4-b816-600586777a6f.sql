-- SECURITY FIX: Drop and recreate policies that conflict

-- Drop all existing conflicting policies first
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Restaurant owners can manage their offers" ON public.offers;
DROP POLICY IF EXISTS "Restaurant owners can manage their menus" ON public.menus;
DROP POLICY IF EXISTS "Authenticated users can view active restaurants" ON public.restaurants;

-- Create new secure policies for ratings
CREATE POLICY "Authenticated users can create ratings" 
ON public.ratings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own ratings" 
ON public.ratings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Create new secure policies for offers
CREATE POLICY "Restaurant owners manage offers" 
ON public.offers 
FOR ALL 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

-- Create new secure policies for menus
CREATE POLICY "Restaurant owners manage menus" 
ON public.menus 
FOR ALL 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

-- Create new secure policies for restaurants
CREATE POLICY "Authenticated view active restaurants" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (is_active = true);