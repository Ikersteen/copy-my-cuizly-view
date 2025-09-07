-- Fix Security Definer View Issue
-- Remove the security definer view and replace with secure function-based access

-- 1. Drop the problematic security definer view
DROP VIEW IF EXISTS public.secure_waitlist_view;

-- 2. Create a more secure approach using a function instead of a view
CREATE OR REPLACE FUNCTION public.get_secure_waitlist_summary(
  limit_entries INTEGER DEFAULT 10
)
RETURNS TABLE(
  total_entries BIGINT,
  entries_today BIGINT,
  entries_this_week BIGINT,
  entries_this_month BIGINT,
  recent_company_types TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin context first
  IF NOT public.verify_waitlist_admin_context() THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions for waitlist summary';
  END IF;
  
  -- Log the summary access
  INSERT INTO public.waitlist_access_log (
    admin_user_id,
    access_type,
    records_accessed,
    ip_address,
    user_agent,
    access_details
  ) VALUES (
    auth.uid(),
    'summary_access',
    0,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'access_type', 'summary_only',
      'no_personal_data', true
    )
  );
  
  -- Return aggregated, non-sensitive data only
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.waitlist_analytics) as total_entries,
    (SELECT COUNT(*) FROM public.waitlist_analytics WHERE created_at >= CURRENT_DATE) as entries_today,
    (SELECT COUNT(*) FROM public.waitlist_analytics WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as entries_this_week,
    (SELECT COUNT(*) FROM public.waitlist_analytics WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as entries_this_month,
    (SELECT ARRAY_AGG(DISTINCT restaurant_type) FROM public.waitlist_analytics WHERE restaurant_type IS NOT NULL LIMIT limit_entries) as recent_company_types;
END;
$$;

-- 3. Revoke any broad permissions that might exist
REVOKE ALL ON public.waitlist_analytics FROM PUBLIC;
REVOKE ALL ON public.waitlist_analytics FROM anon;

-- 4. Ensure only the specific secure function can be used by authenticated users
GRANT EXECUTE ON FUNCTION public.get_waitlist_entries_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_waitlist_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_waitlist_admin_context TO authenticated;

-- 5. Create additional audit function to track any schema access
CREATE OR REPLACE FUNCTION public.audit_table_access_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any attempted access to sensitive tables
  PERFORM public.log_security_event(
    auth.uid(),
    'sensitive_table_access_attempt',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now(),
      'user_authenticated', (auth.uid() IS NOT NULL),
      'user_role', CASE WHEN auth.uid() IS NOT NULL THEN auth.role() ELSE 'anonymous' END
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 6. Update the existing trigger to use the new audit function  
DROP TRIGGER IF EXISTS waitlist_access_monitor ON public.waitlist_analytics;
CREATE TRIGGER waitlist_access_audit
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.waitlist_analytics
  FOR EACH STATEMENT EXECUTE FUNCTION public.audit_table_access_attempt();

-- 7. Add row-level trigger for more granular logging
CREATE OR REPLACE FUNCTION public.log_row_level_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log SELECT operations to avoid performance impact on inserts
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'waitlist_row_accessed',
      jsonb_build_object(
        'operation', TG_OP,
        'accessed_fields', CASE 
          WHEN NEW IS NOT NULL THEN jsonb_build_object('id', NEW.id, 'created_at', NEW.created_at)
          WHEN OLD IS NOT NULL THEN jsonb_build_object('id', OLD.id, 'created_at', OLD.created_at)
          ELSE '{}'::jsonb
        END
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 8. Strengthen the admin verification to prevent any loopholes
CREATE OR REPLACE FUNCTION public.verify_waitlist_admin_context()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  user_role_verified BOOLEAN := false;
  session_valid BOOLEAN := false;
BEGIN
  -- Get current user
  admin_user_id := auth.uid();
  
  -- Must be authenticated
  IF admin_user_id IS NULL OR auth.role() != 'authenticated' THEN
    PERFORM public.log_security_event(
      admin_user_id,
      'unauthorized_waitlist_access_attempt',
      jsonb_build_object(
        'reason', 'not_authenticated',
        'auth_uid', admin_user_id,
        'auth_role', auth.role(),
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Verify admin role exists in user_roles table
  SELECT true INTO user_role_verified
  FROM public.user_roles 
  WHERE user_id = admin_user_id 
    AND role = 'admin'::app_role;
  
  IF NOT user_role_verified THEN
    PERFORM public.log_security_event(
      admin_user_id,
      'unauthorized_waitlist_access_attempt',
      jsonb_build_object(
        'reason', 'insufficient_privileges',
        'required_role', 'admin',
        'user_id', admin_user_id,
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Additional check: verify session is recent (within last 8 hours)
  -- This prevents token replay attacks
  IF EXTRACT(EPOCH FROM (now() - auth.jwt()->>'iat'::text::timestamp)) > 28800 THEN
    PERFORM public.log_security_event(
      admin_user_id,
      'stale_session_detected',
      jsonb_build_object(
        'reason', 'session_too_old',
        'session_age_seconds', EXTRACT(EPOCH FROM (now() - auth.jwt()->>'iat'::text::timestamp)),
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Log legitimate admin access
  PERFORM public.log_security_event(
    admin_user_id,
    'waitlist_admin_access_granted',
    jsonb_build_object(
      'access_type', 'verified_admin',
      'verification_level', 'maximum',
      'timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN TRUE;
END;
$$;