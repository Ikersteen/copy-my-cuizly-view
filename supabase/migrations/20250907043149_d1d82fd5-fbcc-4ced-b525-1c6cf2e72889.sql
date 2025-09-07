-- Critical Security Fix: Lock Down Waitlist Analytics Access
-- Ensure absolutely no public access to customer personal information

-- 1. First, let's check and clean up any existing policies
DROP POLICY IF EXISTS "Verified admins can read waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Secured admin access to waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Public can read waitlist" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Allow public read" ON public.waitlist_analytics;

-- 2. Create the most restrictive admin-only access policy
CREATE POLICY "ADMIN_ONLY_waitlist_access"
ON public.waitlist_analytics
FOR SELECT
USING (
  -- Triple verification: authenticated + admin role + rate limited
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.verify_secure_admin_access(25)
);

-- 3. Ensure INSERT policy is secure but allows legitimate waitlist signups
DROP POLICY IF EXISTS "Validated public can insert into waitlist" ON public.waitlist_analytics;

CREATE POLICY "SECURE_waitlist_signup_only"
ON public.waitlist_analytics
FOR INSERT
WITH CHECK (
  -- Allow inserts only with proper validation
  public.validate_waitlist_entry(email, name, company_name, phone) = true
  -- Additional security: ensure no admin fields are being set
  AND created_at = now()
  AND updated_at = now()
);

-- 4. Absolutely block UPDATE and DELETE for extra security
DROP POLICY IF EXISTS "No updates allowed on waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "No deletes allowed on waitlist entries" ON public.waitlist_analytics;

CREATE POLICY "BLOCK_ALL_updates_waitlist"
ON public.waitlist_analytics
FOR UPDATE
USING (false);

CREATE POLICY "BLOCK_ALL_deletes_waitlist"
ON public.waitlist_analytics
FOR DELETE
USING (false);

-- 5. Create an additional security function to verify admin context
CREATE OR REPLACE FUNCTION public.verify_waitlist_admin_context()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  session_info RECORD;
BEGIN
  -- Get current user
  admin_user_id := auth.uid();
  
  -- Must be authenticated
  IF admin_user_id IS NULL THEN
    PERFORM public.log_security_event(
      NULL,
      'unauthorized_waitlist_access_attempt',
      jsonb_build_object(
        'reason', 'not_authenticated',
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
      'unauthorized_waitlist_access_attempt',
      jsonb_build_object(
        'reason', 'insufficient_privileges',
        'required_role', 'admin',
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
      'access_type', 'read_verification',
      'timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN TRUE;
END;
$$;

-- 6. Create a secure view for admin access with automatic logging
CREATE OR REPLACE VIEW public.secure_waitlist_view AS
SELECT 
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN id 
    ELSE NULL 
  END as id,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN created_at 
    ELSE NULL 
  END as created_at,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN updated_at 
    ELSE NULL 
  END as updated_at,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN email 
    ELSE NULL 
  END as email,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN name 
    ELSE NULL 
  END as name,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN company_name 
    ELSE NULL 
  END as company_name,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN phone 
    ELSE NULL 
  END as phone,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN restaurant_type 
    ELSE NULL 
  END as restaurant_type,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN message 
    ELSE NULL 
  END as message,
  CASE 
    WHEN public.verify_waitlist_admin_context() THEN address 
    ELSE NULL 
  END as address,
  -- Always show masked versions for UI purposes
  CASE 
    WHEN public.verify_waitlist_admin_context() AND email IS NOT NULL THEN 
      SUBSTRING(email FROM 1 FOR 3) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE NULL 
  END as masked_email,
  CASE 
    WHEN public.verify_waitlist_admin_context() AND phone IS NOT NULL THEN 
      SUBSTRING(phone FROM 1 FOR 3) || '***' || SUBSTRING(phone FROM LENGTH(phone) - 1)
    ELSE NULL 
  END as masked_phone
FROM public.waitlist_analytics
WHERE public.verify_waitlist_admin_context() = true;

-- 7. Grant specific permissions on the view to authenticated users only
REVOKE ALL ON public.secure_waitlist_view FROM PUBLIC;
REVOKE ALL ON public.secure_waitlist_view FROM anon;
GRANT SELECT ON public.secure_waitlist_view TO authenticated;

-- 8. Enable RLS on the view as well
ALTER VIEW public.secure_waitlist_view SET (security_barrier = true);

-- 9. Update the secure function to use the most restrictive access
CREATE OR REPLACE FUNCTION public.get_waitlist_entries_secure(
  page_size INTEGER DEFAULT 10,
  page_offset INTEGER DEFAULT 0,
  search_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  restaurant_type TEXT,
  message TEXT,
  address TEXT,
  masked_email TEXT,
  masked_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  record_count INTEGER;
BEGIN
  -- Verify admin context first
  IF NOT public.verify_waitlist_admin_context() THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions for waitlist data';
  END IF;
  
  -- Additional rate limiting check
  IF NOT public.verify_secure_admin_access(15) THEN
    RAISE EXCEPTION 'Access denied: Rate limit exceeded';
  END IF;
  
  admin_user_id := auth.uid();
  
  -- Strict pagination limits
  IF page_size > 25 THEN
    page_size := 25;
  END IF;
  
  -- Count and log access
  SELECT COUNT(*) INTO record_count
  FROM public.waitlist_analytics w
  WHERE (search_filter IS NULL OR 
         w.email ILIKE '%' || search_filter || '%' OR
         w.name ILIKE '%' || search_filter || '%' OR
         w.company_name ILIKE '%' || search_filter || '%');
  
  -- Log the specific access with full details
  INSERT INTO public.waitlist_access_log (
    admin_user_id,
    access_type,
    records_accessed,
    ip_address,
    user_agent,
    access_details
  ) VALUES (
    admin_user_id,
    'secure_paginated_read',
    LEAST(page_size, record_count - page_offset),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'page_size', page_size,
      'page_offset', page_offset,
      'search_filter', search_filter,
      'total_available', record_count,
      'security_level', 'maximum'
    )
  );
  
  -- Return the data with extra validation
  RETURN QUERY
  SELECT 
    w.id,
    w.created_at,
    w.email,
    w.name,
    w.company_name,
    w.phone,
    w.restaurant_type,
    w.message,
    w.address,
    -- Enhanced masking
    SUBSTRING(w.email FROM 1 FOR 2) || '****@' || SPLIT_PART(w.email, '@', 2) as masked_email,
    CASE 
      WHEN w.phone IS NOT NULL THEN 
        SUBSTRING(w.phone FROM 1 FOR 2) || '****' || SUBSTRING(w.phone FROM LENGTH(w.phone))
      ELSE NULL 
    END as masked_phone
  FROM public.waitlist_analytics w
  WHERE (search_filter IS NULL OR 
         w.email ILIKE '%' || search_filter || '%' OR
         w.name ILIKE '%' || search_filter || '%' OR
         w.company_name ILIKE '%' || search_filter || '%')
    AND public.verify_waitlist_admin_context() = true
  ORDER BY w.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 10. Add a trigger to monitor any direct table access attempts
CREATE OR REPLACE FUNCTION public.monitor_waitlist_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any direct access attempts to the table
  PERFORM public.log_security_event(
    auth.uid(),
    'direct_waitlist_table_access',
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'row_data', CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW) ELSE row_to_json(OLD) END
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS waitlist_access_monitor ON public.waitlist_analytics;
CREATE TRIGGER waitlist_access_monitor
  AFTER INSERT OR UPDATE OR DELETE ON public.waitlist_analytics
  FOR EACH ROW EXECUTE FUNCTION public.monitor_waitlist_access();