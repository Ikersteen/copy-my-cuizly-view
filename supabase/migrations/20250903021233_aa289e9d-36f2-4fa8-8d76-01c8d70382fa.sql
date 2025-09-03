-- Enhanced security for waitlist_analytics table - Part 2: Policies and Triggers
-- Update RLS policies with enhanced security

-- Drop existing policies to recreate them with validation
DROP POLICY IF EXISTS "Public can insert into waitlist" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Validated public can insert into waitlist" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Only admins can read waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Verified admins can read waitlist entries" ON public.waitlist_analytics;

-- Recreate policies with enhanced security
CREATE POLICY "Validated public can insert into waitlist"
ON public.waitlist_analytics
FOR INSERT
WITH CHECK (
  public.validate_waitlist_entry(email, name, company_name, phone) = true
);

CREATE POLICY "Verified admins can read waitlist entries"
ON public.waitlist_analytics
FOR SELECT
USING (public.verify_admin_access() = true);

-- Add policies to prevent updates and deletes (data integrity)
CREATE POLICY "No updates allowed on waitlist entries"
ON public.waitlist_analytics
FOR UPDATE
USING (false);

CREATE POLICY "No deletes allowed on waitlist entries"  
ON public.waitlist_analytics
FOR DELETE
USING (false);

-- Create function to log security events for waitlist
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