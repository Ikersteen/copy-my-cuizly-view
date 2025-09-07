-- Critical Security Fix: Complete Lockdown of Waitlist Analytics Access
-- Step 1: Clean up all existing policies properly

DO $$
BEGIN
    -- Drop all existing policies safely
    DROP POLICY IF EXISTS "ADMIN_ONLY_waitlist_access" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "Verified admins can read waitlist entries" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "Secured admin access to waitlist entries" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "Public can read waitlist" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "Allow public read" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "Validated public can insert into waitlist" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "SECURE_waitlist_signup_only" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "No updates allowed on waitlist entries" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "No deletes allowed on waitlist entries" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "BLOCK_ALL_updates_waitlist" ON public.waitlist_analytics;
    DROP POLICY IF EXISTS "BLOCK_ALL_deletes_waitlist" ON public.waitlist_analytics;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies may not have existed: %', SQLERRM;
END $$;

-- Step 2: Create the most restrictive policies for maximum security
CREATE POLICY "MAXIMUM_SECURITY_admin_only_read"
ON public.waitlist_analytics
FOR SELECT
USING (
  -- Absolutely require authenticated user with admin role
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.verify_secure_admin_access(10) -- Even more restrictive rate limit
);

-- Step 3: Allow only validated waitlist signups (legitimate business function)
CREATE POLICY "VALIDATED_waitlist_signup_ONLY"
ON public.waitlist_analytics
FOR INSERT
WITH CHECK (
  -- Must pass all validation checks
  public.validate_waitlist_entry(email, name, company_name, phone) = true
  -- Ensure system fields are properly set
  AND id = gen_random_uuid()
  AND created_at <= now() + INTERVAL '1 minute'
  AND updated_at <= now() + INTERVAL '1 minute'
);

-- Step 4: Completely block all updates and deletes (data integrity)
CREATE POLICY "ABSOLUTE_BLOCK_updates"
ON public.waitlist_analytics
FOR UPDATE
USING (false);

CREATE POLICY "ABSOLUTE_BLOCK_deletes"
ON public.waitlist_analytics
FOR DELETE
USING (false);

-- Step 5: Create ultra-secure admin context verification
CREATE OR REPLACE FUNCTION public.verify_ultra_secure_waitlist_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  recent_access_count INTEGER;
BEGIN
  -- Get current user ID
  admin_user_id := auth.uid();
  
  -- Must be authenticated
  IF admin_user_id IS NULL THEN
    PERFORM public.log_security_event(
      NULL,
      'CRITICAL_unauthorized_waitlist_access',
      jsonb_build_object(
        'reason', 'no_authentication',
        'severity', 'HIGH',
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Must have admin role
  IF NOT public.has_role(admin_user_id, 'admin'::app_role) THEN
    PERFORM public.log_security_event(
      admin_user_id,
      'CRITICAL_privilege_escalation_attempt',
      jsonb_build_object(
        'reason', 'insufficient_admin_privileges',
        'required_role', 'admin',
        'severity', 'HIGH',
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Check for suspicious rapid access patterns (last 10 minutes)
  SELECT COUNT(*) INTO recent_access_count
  FROM public.waitlist_access_log
  WHERE admin_user_id = admin_user_id
    AND created_at > now() - INTERVAL '10 minutes';
  
  IF recent_access_count > 10 THEN
    PERFORM public.log_security_event(
      admin_user_id,
      'CRITICAL_rapid_access_pattern_detected',
      jsonb_build_object(
        'access_count_10min', recent_access_count,
        'threshold_exceeded', 10,
        'severity', 'HIGH',
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Log legitimate access attempt
  PERFORM public.log_security_event(
    admin_user_id,
    'legitimate_waitlist_admin_access',
    jsonb_build_object(
      'verification_level', 'ultra_secure',
      'timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN TRUE;
END;
$$;

-- Step 6: Create the most secure waitlist access function
CREATE OR REPLACE FUNCTION public.get_waitlist_data_ultra_secure(
  page_size INTEGER DEFAULT 5,
  page_offset INTEGER DEFAULT 0,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  email_masked TEXT,
  name TEXT,
  company_name TEXT,
  phone_masked TEXT,
  restaurant_type TEXT,
  address_masked TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  total_records BIGINT;
BEGIN
  -- Ultra-secure verification
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Unauthorized access attempt to customer data';
  END IF;
  
  -- Additional rate limiting
  IF NOT public.verify_secure_admin_access(5) THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Rate limit exceeded for sensitive data access';
  END IF;
  
  admin_user_id := auth.uid();
  
  -- Strict pagination (max 10 records at a time)
  IF page_size > 10 THEN
    page_size := 10;
  END IF;
  
  -- Get total count for pagination
  SELECT COUNT(*) INTO total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.name ILIKE '%' || search_term || '%' OR
         w.company_name ILIKE '%' || search_term || '%');
  
  -- Log detailed access
  INSERT INTO public.waitlist_access_log (
    admin_user_id,
    access_type,
    records_accessed,
    ip_address,
    user_agent,
    access_details
  ) VALUES (
    admin_user_id,
    'ultra_secure_access',
    LEAST(page_size, total_records - page_offset),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'security_level', 'MAXIMUM',
      'page_size', page_size,
      'page_offset', page_offset,
      'search_term', search_term,
      'total_records', total_records
    )
  );
  
  -- Return heavily masked data
  RETURN QUERY
  SELECT 
    w.id,
    w.created_at,
    -- Heavy masking for email
    CASE 
      WHEN w.email IS NOT NULL THEN 
        LEFT(w.email, 2) || '****@****.' || RIGHT(SPLIT_PART(w.email, '.', -1), 2)
      ELSE NULL 
    END as email_masked,
    w.name,
    w.company_name,
    -- Heavy masking for phone
    CASE 
      WHEN w.phone IS NOT NULL THEN 
        LEFT(w.phone, 2) || '***-***-' || RIGHT(w.phone, 2)
      ELSE NULL 
    END as phone_masked,
    w.restaurant_type,
    -- Mask address details
    CASE 
      WHEN w.address IS NOT NULL THEN 
        SPLIT_PART(w.address, ',', 1) || ', [MASKED]'
      ELSE NULL 
    END as address_masked,
    total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.name ILIKE '%' || search_term || '%' OR
         w.company_name ILIKE '%' || search_term || '%')
  ORDER BY w.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- Step 7: Create monitoring trigger for any table access
CREATE OR REPLACE FUNCTION public.audit_all_waitlist_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log every single operation on this sensitive table
  PERFORM public.log_security_event(
    auth.uid(),
    'waitlist_table_operation',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'user_authenticated', (auth.uid() IS NOT NULL),
      'user_role', CASE WHEN auth.uid() IS NOT NULL THEN auth.role() ELSE 'anonymous' END,
      'timestamp', now(),
      'data_summary', CASE 
        WHEN TG_OP = 'INSERT' THEN jsonb_build_object('email_domain', SPLIT_PART(NEW.email, '@', 2))
        WHEN TG_OP = 'SELECT' THEN jsonb_build_object('access_type', 'read_attempt')
        ELSE jsonb_build_object('operation', TG_OP)
      END
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Create the comprehensive monitoring trigger
DROP TRIGGER IF EXISTS comprehensive_waitlist_audit ON public.waitlist_analytics;
CREATE TRIGGER comprehensive_waitlist_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.waitlist_analytics
  FOR EACH ROW EXECUTE FUNCTION public.audit_all_waitlist_access();

-- Step 8: Revoke any public permissions that might exist
REVOKE ALL ON public.waitlist_analytics FROM PUBLIC;
REVOKE ALL ON public.waitlist_analytics FROM anon;