-- Fix function search paths for better security
-- This prevents potential SQL injection through search_path manipulation

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Minimum 8 characters
  IF LENGTH(password) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain number
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain special character
  IF password !~ '[^A-Za-z0-9]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

-- Fix log_profile_changes function
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log profile updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'profile_updated',
      jsonb_build_object(
        'old_values', row_to_json(OLD),
        'new_values', row_to_json(NEW)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_session_security function
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log authentication events
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.id,
      'user_signed_up',
      jsonb_build_object(
        'email', NEW.email,
        'provider', COALESCE(NEW.app_metadata->>'provider', 'email')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix get_translated_description function
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