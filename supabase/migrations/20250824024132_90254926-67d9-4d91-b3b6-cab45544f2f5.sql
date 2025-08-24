-- SECURITY FIX: Restrict RLS policies to require authentication

-- Drop existing policies that allow public access to sensitive data
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Anyone can view active menus" ON public.menus;

-- Create new secure policies for ratings
CREATE POLICY "Authenticated users can view ratings" 
ON public.ratings 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create their own ratings" 
ON public.ratings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.ratings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Create new secure policies for offers
CREATE POLICY "Authenticated users can view active offers" 
ON public.offers 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their offers" 
ON public.offers 
FOR ALL 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

-- Create new secure policies for menus
CREATE POLICY "Authenticated users can view active menus" 
ON public.menus 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their menus" 
ON public.menus 
FOR ALL 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())
));

-- Update restaurant policies to be more explicit about authentication
DROP POLICY IF EXISTS "Public can view basic restaurant info" ON public.restaurants;

CREATE POLICY "Authenticated users can view active restaurants" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Allow public access only for restaurant browsing (this is the only truly public data)
CREATE POLICY "Public can view active restaurants for browsing" 
ON public.restaurants 
FOR SELECT 
TO anon
USING (is_active = true);

-- Secure database functions with explicit search_path
CREATE OR REPLACE FUNCTION public.update_restaurant_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  -- Update analytics based on the trigger
  IF TG_TABLE_NAME = 'ratings' THEN
    INSERT INTO public.restaurant_analytics (restaurant_id, rating_count, average_rating)
    VALUES (
      NEW.restaurant_id, 
      1,
      NEW.rating
    )
    ON CONFLICT (restaurant_id, date)
    DO UPDATE SET
      rating_count = restaurant_analytics.rating_count + 1,
      average_rating = (
        SELECT AVG(rating) 
        FROM public.ratings 
        WHERE restaurant_id = NEW.restaurant_id
      ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $function$
DECLARE
  user_type_value public.user_type;
  restaurant_id_value uuid;
BEGIN
  -- Extract user_type from metadata, default to consumer
  user_type_value := COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'consumer'::public.user_type);
  
  -- Insert profile
  INSERT INTO public.profiles (
    user_id, 
    user_type, 
    first_name, 
    last_name,
    restaurant_name
  ) VALUES (
    NEW.id,
    user_type_value,
    SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1),
    SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 2),
    NEW.raw_user_meta_data->>'restaurant_name'
  );

  -- If user is a restaurant owner, create a restaurant entry
  IF user_type_value = 'restaurant_owner' THEN
    INSERT INTO public.restaurants (
      owner_id,
      name,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'restaurant_name', 'Mon Restaurant'),
      true
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;