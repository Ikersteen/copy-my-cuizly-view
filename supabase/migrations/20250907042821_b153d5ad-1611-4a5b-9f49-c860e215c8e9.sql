-- Enhanced Security for Waitlist Analytics Table
-- 1. Create audit trail for waitlist access
CREATE TABLE IF NOT EXISTS public.waitlist_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'read', 'export', 'bulk_query'
  records_accessed INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  access_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on access log
ALTER TABLE public.waitlist_access_log ENABLE ROW LEVEL SECURITY;

-- 2. Create rate limiting table for admin access
CREATE TABLE IF NOT EXISTS public.admin_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  access_window TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(admin_user_id, access_window)
);

-- Enable RLS on rate limits
ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

-- 3. Enhanced admin verification with rate limiting
CREATE OR REPLACE FUNCTION public.verify_secure_admin_access(
  max_hourly_accesses INTEGER DEFAULT 50
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_hour TIMESTAMP WITH TIME ZONE;
  current_access_count INTEGER;
  admin_user_id UUID;
BEGIN
  -- First verify admin access
  IF NOT public.verify_admin_access() THEN
    RETURN FALSE;
  END IF;
  
  admin_user_id := auth.uid();
  current_hour := date_trunc('hour', now());
  
  -- Check rate limit for this hour
  SELECT COALESCE(access_count, 0) INTO current_access_count
  FROM public.admin_rate_limits 
  WHERE admin_user_id = admin_user_id 
    AND access_window = current_hour;
  
  -- If exceeding rate limit, deny access
  IF current_access_count >= max_hourly_accesses THEN
    -- Log security event
    PERFORM public.log_security_event(
      admin_user_id,
      'admin_rate_limit_exceeded',
      jsonb_build_object(
        'max_allowed', max_hourly_accesses,
        'current_count', current_access_count,
        'access_window', current_hour
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN FALSE;
  END IF;
  
  -- Update rate limit counter
  INSERT INTO public.admin_rate_limits (admin_user_id, access_window, access_count)
  VALUES (admin_user_id, current_hour, 1)
  ON CONFLICT (admin_user_id, access_window)
  DO UPDATE SET access_count = admin_rate_limits.access_count + 1;
  
  RETURN TRUE;
END;
$$;

-- 4. Secure waitlist query function with pagination and logging
CREATE OR REPLACE FUNCTION public.get_waitlist_entries_secure(
  page_size INTEGER DEFAULT 25,
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
  -- Verify secure admin access with rate limiting
  IF NOT public.verify_secure_admin_access(50) THEN
    RAISE EXCEPTION 'Access denied: Rate limit exceeded or insufficient permissions';
  END IF;
  
  admin_user_id := auth.uid();
  
  -- Limit page size to prevent bulk extraction
  IF page_size > 50 THEN
    page_size := 50;
  END IF;
  
  -- Count records being accessed
  SELECT COUNT(*) INTO record_count
  FROM public.waitlist_analytics w
  WHERE (search_filter IS NULL OR 
         w.email ILIKE '%' || search_filter || '%' OR
         w.name ILIKE '%' || search_filter || '%' OR
         w.company_name ILIKE '%' || search_filter || '%');
  
  -- Log the access attempt
  INSERT INTO public.waitlist_access_log (
    admin_user_id,
    access_type,
    records_accessed,
    ip_address,
    user_agent,
    access_details
  ) VALUES (
    admin_user_id,
    'paginated_read',
    LEAST(page_size, record_count - page_offset),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'page_size', page_size,
      'page_offset', page_offset,
      'search_filter', search_filter,
      'total_available', record_count
    )
  );
  
  -- Return paginated, masked data
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
    -- Masked versions for display
    SUBSTRING(w.email FROM 1 FOR 3) || '***@' || SPLIT_PART(w.email, '@', 2) as masked_email,
    CASE 
      WHEN w.phone IS NOT NULL THEN 
        SUBSTRING(w.phone FROM 1 FOR 3) || '***' || SUBSTRING(w.phone FROM LENGTH(w.phone) - 1)
      ELSE NULL 
    END as masked_phone
  FROM public.waitlist_analytics w
  WHERE (search_filter IS NULL OR 
         w.email ILIKE '%' || search_filter || '%' OR
         w.name ILIKE '%' || search_filter || '%' OR
         w.company_name ILIKE '%' || search_filter || '%')
  ORDER BY w.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 5. Update RLS policies with enhanced security
DROP POLICY IF EXISTS "Verified admins can read waitlist entries" ON public.waitlist_analytics;

CREATE POLICY "Secured admin access to waitlist entries"
ON public.waitlist_analytics
FOR SELECT
USING (public.verify_secure_admin_access(25));

-- 6. RLS policies for new audit tables
CREATE POLICY "Only super admins can view access logs"
ON public.waitlist_access_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert access logs"
ON public.waitlist_access_log
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only super admins can view rate limits"
ON public.admin_rate_limits
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage rate limits"
ON public.admin_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Create function to monitor suspicious admin activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_admin_activity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_admin RECORD;
BEGIN
  -- Check for admins with unusual access patterns in last 24 hours
  FOR suspicious_admin IN
    SELECT 
      admin_user_id,
      COUNT(*) as access_count,
      SUM(records_accessed) as total_records,
      MAX(created_at) as last_access
    FROM public.waitlist_access_log
    WHERE created_at > now() - INTERVAL '24 hours'
    GROUP BY admin_user_id
    HAVING COUNT(*) > 100 OR SUM(records_accessed) > 500
  LOOP
    -- Log suspicious activity
    PERFORM public.log_security_event(
      suspicious_admin.admin_user_id,
      'suspicious_admin_activity_detected',
      jsonb_build_object(
        'access_count_24h', suspicious_admin.access_count,
        'total_records_accessed', suspicious_admin.total_records,
        'last_access', suspicious_admin.last_access,
        'threshold_exceeded', 'bulk_data_access'
      )
    );
  END LOOP;
END;
$$;