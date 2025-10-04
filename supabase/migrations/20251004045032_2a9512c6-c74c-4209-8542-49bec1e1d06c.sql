-- Update handle_new_user trigger to include user_type and restaurant_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, username, user_type, restaurant_name, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'username',
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::user_type, 'consumer'::user_type),
    NEW.raw_user_meta_data ->> 'restaurant_name',
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  
  -- Si c'est un propriétaire de restaurant avec un nom de restaurant, créer le restaurant
  IF (NEW.raw_user_meta_data ->> 'user_type') = 'restaurant_owner' 
     AND (NEW.raw_user_meta_data ->> 'restaurant_name') IS NOT NULL THEN
    INSERT INTO public.restaurants (name, owner_id, description, is_active)
    VALUES (
      NEW.raw_user_meta_data ->> 'restaurant_name',
      NEW.id,
      'Bienvenue chez ' || (NEW.raw_user_meta_data ->> 'restaurant_name'),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;