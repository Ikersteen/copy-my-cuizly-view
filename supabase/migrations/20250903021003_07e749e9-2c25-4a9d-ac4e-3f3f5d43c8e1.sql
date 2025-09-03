-- Enhanced security for waitlist_analytics table
-- Add input validation and rate limiting protection

-- Create function to validate waitlist entries
CREATE OR REPLACE FUNCTION public.validate_waitlist_entry(
  email_input TEXT,
  name_input TEXT,
  company_name_input TEXT DEFAULT NULL,
  phone_input TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate email format
  IF NOT public.validate_email_domain(email_input) THEN
    RETURN FALSE;
  END IF;
  
  -- Validate name (minimum 2 characters, no special characters except spaces, hyphens, apostrophes)
  IF name_input IS NULL OR LENGTH(TRIM(name_input)) < 2 OR name_input !~ '^[a-zA-ZÀ-ÿ\s''\-\.]{2,50}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate company name if provided (allow letters, numbers, spaces, common punctuation)
  IF company_name_input IS NOT NULL AND (
    LENGTH(TRIM(company_name_input)) < 1 OR 
    company_name_input !~ '^[a-zA-ZÀ-ÿ0-9\s''\-\.\,\&\(\)]{1,100}$'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Validate phone if provided (basic format check)
  IF phone_input IS NOT NULL AND (
    LENGTH(TRIM(phone_input)) < 10 OR
    phone_input !~ '^[\+]?[0-9\s\-\(\)\.]{10,20}$'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for duplicate email within last 24 hours (rate limiting)
  IF EXISTS (
    SELECT 1 FROM public.waitlist_analytics 
    WHERE email = email_input 
    AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update the RLS policy for waitlist inserts with validation
DROP POLICY IF EXISTS "Public can insert into waitlist" ON public.waitlist_analytics;

CREATE POLICY "Validated public can insert into waitlist"
ON public.waitlist_analytics
FOR INSERT
WITH CHECK (
  -- Use our validation function
  public.validate_waitlist_entry(email, name, company_name, phone) = true
);

-- Create function to log suspicious waitlist activity
CREATE OR REPLACE FUNCTION public.log_waitlist_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log successful waitlist insertion
  PERFORM public.log_security_event(
    NULL, -- No user ID for public insertions
    'waitlist_entry_created',
    jsonb_build_object(
      'email_domain', SPLIT_PART(NEW.email, '@', 2),
      'has_company', (NEW.company_name IS NOT NULL),
      'has_phone', (NEW.phone IS NOT NULL),
      'entry_source', 'public_form'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

-- Add trigger to log waitlist entries
DROP TRIGGER IF EXISTS waitlist_security_log ON public.waitlist_analytics;
CREATE TRIGGER waitlist_security_log
  AFTER INSERT ON public.waitlist_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_waitlist_security_event();

-- Enhanced admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Double verification: user must be authenticated AND have admin role
  RETURN (
    auth.uid() IS NOT NULL 
    AND auth.role() = 'authenticated'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
END;
$$;

-- Update admin access policy for reading waitlist
DROP POLICY IF EXISTS "Only admins can read waitlist entries" ON public.waitlist_analytics;

CREATE POLICY "Verified admins can read waitlist entries"
ON public.waitlist_analytics
FOR SELECT
USING (public.verify_admin_access() = true);

-- Add policy to prevent updates and deletes (data integrity)
CREATE POLICY "No updates allowed on waitlist entries"
ON public.waitlist_analytics
FOR UPDATE
USING (false);

CREATE POLICY "No deletes allowed on waitlist entries"  
ON public.waitlist_analytics
FOR DELETE
USING (false);

-- Log the security enhancement
SELECT public.log_security_event(
  auth.uid(),
  'waitlist_security_enhanced',
  jsonb_build_object(
    'changes', ARRAY[
      'added_input_validation',
      'added_rate_limiting', 
      'enhanced_admin_verification',
      'added_security_logging',
      'disabled_updates_deletes'
    ],
    'timestamp', NOW()
  )
);