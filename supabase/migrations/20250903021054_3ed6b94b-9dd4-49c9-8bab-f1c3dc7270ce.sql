-- Enhanced security for waitlist_analytics table - Part 1: Functions
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