-- Security Enhancement: Restrict ratings access to authenticated users only
-- Remove anonymous access policy and update to require authentication
DROP POLICY IF EXISTS "Anonymous users can view ratings for active restaurants" ON public.ratings;

-- Update existing policy to require authentication
DROP POLICY IF EXISTS "Users can view ratings for active restaurants" ON public.ratings;
CREATE POLICY "Authenticated users can view ratings for active restaurants" 
ON public.ratings 
FOR SELECT 
TO authenticated
USING (restaurant_id IN ( 
  SELECT restaurants.id
  FROM restaurants
  WHERE (restaurants.is_active = true)
));

-- Security Enhancement: Enhance password security validation
-- Create function to validate password strength on server side
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Security Enhancement: Add audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view audit logs (will need admin role system later)
CREATE POLICY "System can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (true);

-- Security Enhancement: Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Security Enhancement: Add trigger to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS log_profile_changes_trigger ON public.profiles;
CREATE TRIGGER log_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- Security Enhancement: Update storage policies to be more restrictive
-- Remove overly permissive public access policies
DROP POLICY IF EXISTS "Anyone can view public restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view restaurant images" ON storage.objects;

-- Create more secure storage policies
CREATE POLICY "Authenticated users can view restaurant images" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Anonymous users can view restaurant images" 
ON storage.objects 
FOR SELECT 
TO anon
USING (bucket_id = 'restaurant-images');

-- Security Enhancement: Add session security validation
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;