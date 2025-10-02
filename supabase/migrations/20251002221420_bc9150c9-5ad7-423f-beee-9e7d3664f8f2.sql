-- ============================================
-- SECURITY ENHANCEMENT: Address Data Protection
-- Fixes: Customer Home Addresses Could Be Exposed to Attackers
-- ============================================

-- 1. Create secure address access verification function
CREATE OR REPLACE FUNCTION public.verify_secure_address_access(p_user_id uuid, p_address_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_authenticated boolean;
  recent_access_count integer;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- CRITICAL: User must be authenticated
  IF current_user_id IS NULL THEN
    PERFORM public.log_security_event(
      NULL,
      'unauthorized_address_access_attempt',
      jsonb_build_object(
        'reason', 'not_authenticated',
        'severity', 'HIGH',
        'attempted_user_id', p_user_id,
        'attempted_address_id', p_address_id,
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Verify user is accessing their own data
  IF current_user_id != p_user_id THEN
    PERFORM public.log_security_event(
      current_user_id,
      'CRITICAL_address_access_violation',
      jsonb_build_object(
        'reason', 'user_id_mismatch',
        'severity', 'CRITICAL',
        'current_user', current_user_id,
        'attempted_user_id', p_user_id,
        'attempted_address_id', p_address_id,
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Check for suspicious rapid access patterns (rate limiting)
  SELECT COUNT(*) INTO recent_access_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
    AND event_type = 'address_data_access'
    AND created_at > now() - INTERVAL '5 minutes';
  
  IF recent_access_count > 50 THEN
    PERFORM public.log_security_event(
      current_user_id,
      'CRITICAL_address_enumeration_detected',
      jsonb_build_object(
        'reason', 'excessive_access_attempts',
        'severity', 'CRITICAL',
        'access_count_5min', recent_access_count,
        'threshold_exceeded', 50,
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Log legitimate access
  PERFORM public.log_security_event(
    current_user_id,
    'address_data_access',
    jsonb_build_object(
      'user_id', p_user_id,
      'address_id', p_address_id,
      'verification_level', 'secure',
      'timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN TRUE;
END;
$$;

-- 2. Create trigger to audit all address table operations
CREATE OR REPLACE FUNCTION public.audit_address_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Log every operation on sensitive address data
  PERFORM public.log_security_event(
    current_user_id,
    'address_table_operation',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'user_authenticated', (current_user_id IS NOT NULL),
      'timestamp', now(),
      'address_data_summary', CASE 
        WHEN TG_OP = 'INSERT' THEN jsonb_build_object(
          'address_id', NEW.id,
          'user_id', NEW.user_id,
          'city', NEW.city,
          'address_type', NEW.address_type
        )
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
          'address_id', NEW.id,
          'user_id', NEW.user_id,
          'city', NEW.city
        )
        WHEN TG_OP = 'DELETE' THEN jsonb_build_object(
          'address_id', OLD.id,
          'user_id', OLD.user_id
        )
        ELSE jsonb_build_object('operation', TG_OP)
      END
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 3. Drop existing trigger if exists and create new audit trigger
DROP TRIGGER IF EXISTS audit_address_access_trigger ON public.addresses;
CREATE TRIGGER audit_address_access_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_address_access();

-- 4. Create enhanced RLS policies with secure function
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;

-- Create new secure policies with logging
CREATE POLICY "Secure address select policy"
ON public.addresses
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND public.verify_secure_address_access(user_id, id) = true
);

CREATE POLICY "Secure address insert policy"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.verify_secure_address_access(user_id, NULL) = true
);

CREATE POLICY "Secure address update policy"
ON public.addresses
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND public.verify_secure_address_access(user_id, id) = true
)
WITH CHECK (
  auth.uid() = user_id 
  AND public.verify_secure_address_access(user_id, id) = true
);

CREATE POLICY "Secure address delete policy"
ON public.addresses
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND public.verify_secure_address_access(user_id, id) = true
);

-- 5. Create function to detect suspicious address enumeration patterns
CREATE OR REPLACE FUNCTION public.detect_address_enumeration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user RECORD;
BEGIN
  -- Check for users with unusual address access patterns in last hour
  FOR suspicious_user IN
    SELECT 
      user_id,
      COUNT(*) as access_count,
      MAX(created_at) as last_access
    FROM public.security_audit_log
    WHERE created_at > now() - INTERVAL '1 hour'
      AND event_type = 'address_data_access'
    GROUP BY user_id
    HAVING COUNT(*) > 100
  LOOP
    -- Log suspicious activity
    PERFORM public.log_security_event(
      suspicious_user.user_id,
      'CRITICAL_address_enumeration_pattern',
      jsonb_build_object(
        'access_count_1h', suspicious_user.access_count,
        'last_access', suspicious_user.last_access,
        'threshold_exceeded', 100,
        'severity', 'CRITICAL',
        'recommended_action', 'investigate_and_potentially_suspend'
      )
    );
  END LOOP;
END;
$$;

-- 6. Add comment for security documentation
COMMENT ON TABLE public.addresses IS 'SECURITY CRITICAL: Contains sensitive personal location data including home addresses and GPS coordinates. Protected by multi-layer RLS policies with audit logging and rate limiting. All access is logged in security_audit_log table.';

COMMENT ON FUNCTION public.verify_secure_address_access IS 'SECURITY FUNCTION: Validates address data access with authentication checks, user verification, rate limiting, and comprehensive audit logging to prevent unauthorized location tracking and data harvesting.';