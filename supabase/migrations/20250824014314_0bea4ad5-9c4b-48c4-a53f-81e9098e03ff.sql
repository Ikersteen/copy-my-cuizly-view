-- Security Fix: Enable restaurant owners to manage orders for their restaurants

-- Allow restaurant owners to view orders for their restaurants
CREATE POLICY "Restaurant owners can view their restaurant orders" 
ON orders 
FOR SELECT 
USING (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  )
);

-- Allow restaurant owners to update order status for their restaurants
CREATE POLICY "Restaurant owners can update their restaurant orders" 
ON orders 
FOR UPDATE 
USING (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  )
);

-- Update database functions to use secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;