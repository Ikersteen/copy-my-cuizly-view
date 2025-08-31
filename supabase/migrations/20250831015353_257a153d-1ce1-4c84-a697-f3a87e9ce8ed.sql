-- Fix search path security vulnerabilities for functions
-- Set search_path for functions that are missing it

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$function$;

CREATE OR REPLACE FUNCTION public.track_profile_view(p_restaurant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO restaurant_analytics (
    restaurant_id,
    date,
    profile_views,
    menu_views,
    offer_clicks,
    average_rating,
    rating_count
  ) VALUES (
    p_restaurant_id,
    CURRENT_DATE,
    1,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (restaurant_id, date)
  DO UPDATE SET
    profile_views = restaurant_analytics.profile_views + 1,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_user_names(user_ids uuid[])
 RETURNS TABLE(user_id uuid, display_name text, username text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
      THEN CONCAT(p.first_name, ' ', p.last_name)
      WHEN p.first_name IS NOT NULL 
      THEN p.first_name
      WHEN p.username IS NOT NULL 
      THEN p.username
      ELSE 'Utilisateur anonyme'
    END as display_name,
    COALESCE(p.username, 'anonyme') as username
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
  -- SÉCURITÉ: Cette fonction retourne UNIQUEMENT les noms d'affichage, 
  -- PAS les numéros de téléphone ou autres données sensibles
$function$;

CREATE OR REPLACE FUNCTION public.update_analytics_data(p_restaurant_id uuid, p_profile_views integer DEFAULT NULL::integer, p_menu_views integer DEFAULT NULL::integer, p_offer_clicks integer DEFAULT NULL::integer, p_date date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert or update analytics data
  INSERT INTO public.restaurant_analytics (
    restaurant_id,
    date,
    profile_views,
    menu_views,
    offer_clicks
  ) VALUES (
    p_restaurant_id,
    p_date,
    COALESCE(p_profile_views, 0),
    COALESCE(p_menu_views, 0),
    COALESCE(p_offer_clicks, 0)
  )
  ON CONFLICT (restaurant_id, date)
  DO UPDATE SET
    profile_views = CASE 
      WHEN p_profile_views IS NOT NULL THEN restaurant_analytics.profile_views + p_profile_views
      ELSE restaurant_analytics.profile_views
    END,
    menu_views = CASE 
      WHEN p_menu_views IS NOT NULL THEN restaurant_analytics.menu_views + p_menu_views
      ELSE restaurant_analytics.menu_views
    END,
    offer_clicks = CASE 
      WHEN p_offer_clicks IS NOT NULL THEN restaurant_analytics.offer_clicks + p_offer_clicks
      ELSE restaurant_analytics.offer_clicks
    END,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_analytics(p_restaurant_id uuid, p_metric text, p_increment integer DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate metric type
  IF p_metric NOT IN ('profile_views', 'menu_views', 'offer_clicks') THEN
    RAISE EXCEPTION 'Invalid metric type: %', p_metric;
  END IF;

  -- Update the specific metric
  CASE p_metric
    WHEN 'profile_views' THEN
      PERFORM public.update_analytics_data(p_restaurant_id, p_increment, NULL, NULL);
    WHEN 'menu_views' THEN
      PERFORM public.update_analytics_data(p_restaurant_id, NULL, p_increment, NULL);
    WHEN 'offer_clicks' THEN
      PERFORM public.update_analytics_data(p_restaurant_id, NULL, NULL, p_increment);
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_restaurant_analytics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update analytics based on the trigger
  IF TG_TABLE_NAME = 'ratings' THEN
    -- When a rating is added, we don't directly insert into analytics
    -- Instead, we let the analytics be calculated when needed
    -- But we can track rating events if needed
    NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_translated_description(restaurant_row restaurants, language text DEFAULT 'fr'::text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  CASE language
    WHEN 'en' THEN
      RETURN COALESCE(restaurant_row.description_en, restaurant_row.description_fr, restaurant_row.description);
    ELSE
      RETURN COALESCE(restaurant_row.description_fr, restaurant_row.description);
  END CASE;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;