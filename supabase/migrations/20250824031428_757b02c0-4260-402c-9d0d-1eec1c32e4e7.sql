-- Security fixes for database functions and RLS policies

-- 1. Fix database functions security by adding explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- 2. Fix update_restaurant_analytics function security
CREATE OR REPLACE FUNCTION public.update_restaurant_analytics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- 3. Fix update_updated_at_column function security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Tighten RLS policy for ratings table - remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.ratings;

-- Create more restrictive policy for ratings viewing
CREATE POLICY "Users can view ratings for active restaurants" 
ON public.ratings 
FOR SELECT 
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE is_active = true
  )
);

-- 5. Add policy to allow anonymous users to view ratings for active restaurants (for public restaurant pages)
CREATE POLICY "Anonymous users can view ratings for active restaurants" 
ON public.ratings 
FOR SELECT 
TO anon
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE is_active = true
  )
);

-- 6. Ensure restaurant_analytics has proper policies
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.restaurant_analytics;
DROP POLICY IF EXISTS "Service role can update analytics" ON public.restaurant_analytics;

-- More restrictive analytics policies
CREATE POLICY "System can manage analytics" 
ON public.restaurant_analytics 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow restaurant owners to view their own analytics
CREATE POLICY "Restaurant owners can view own analytics" 
ON public.restaurant_analytics 
FOR SELECT 
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);