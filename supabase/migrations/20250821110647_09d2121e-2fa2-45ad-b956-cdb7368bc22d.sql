-- Create trigger to handle new user signup and create profile + restaurant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute function on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();