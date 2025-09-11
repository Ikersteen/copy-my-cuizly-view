-- Create trigger to automatically encrypt PII data on waitlist insert
CREATE OR REPLACE FUNCTION public.encrypt_waitlist_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt sensitive fields automatically
  NEW.email_encrypted := public.encrypt_pii(NEW.email);
  NEW.phone_encrypted := public.encrypt_pii(NEW.phone);
  NEW.address_encrypted := public.encrypt_pii(NEW.address);
  
  -- Create searchable hash for email (for admin searches)
  NEW.email_hash := encode(digest(LOWER(NEW.email), 'sha256'), 'hex');
  
  -- Clear plain text fields for security (keep only encrypted versions)
  NEW.email := '[ENCRYPTED]';
  NEW.name := '[ENCRYPTED]';
  NEW.phone := CASE WHEN NEW.phone IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  NEW.address := CASE WHEN NEW.address IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END; 
  NEW.company_name := CASE WHEN NEW.company_name IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  NEW.message := CASE WHEN NEW.message IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  
  -- Log the encryption for security audit
  PERFORM public.log_security_event(
    NULL, -- No user ID for public waitlist
    'waitlist_pii_encrypted',
    jsonb_build_object(
      'email_domain', SPLIT_PART(public.decrypt_pii(NEW.email_encrypted), '@', 2),
      'has_phone', (NEW.phone_encrypted IS NOT NULL),
      'has_address', (NEW.address_encrypted IS NOT NULL),
      'encryption_timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS encrypt_waitlist_pii_trigger ON public.waitlist_analytics;
CREATE TRIGGER encrypt_waitlist_pii_trigger
  BEFORE INSERT ON public.waitlist_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_waitlist_pii();

-- Update the secure admin access function to only work with encrypted data
CREATE OR REPLACE FUNCTION public.get_waitlist_secure_admin(
  page_size integer DEFAULT 10,
  page_offset integer DEFAULT 0,
  search_term text DEFAULT NULL
) 
RETURNS TABLE(
  id uuid,
  created_at timestamp with time zone,
  email_masked text,
  restaurant_type text,
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  total_records BIGINT;
BEGIN
  -- Verify ultra-secure admin access
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Unauthorized access to customer data';
  END IF;

  admin_user_id := auth.uid();
  
  -- Strict pagination
  IF page_size > 20 THEN
    page_size := 20;
  END IF;
  
  -- Get total count 
  SELECT COUNT(*) INTO total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.email_hash = encode(digest(LOWER(search_term), 'sha256'), 'hex'));
  
  -- Log admin access
  PERFORM public.log_security_event(
    admin_user_id,
    'secure_waitlist_admin_access',
    jsonb_build_object(
      'page_size', page_size,
      'page_offset', page_offset,
      'total_records', total_records,
      'encryption_verified', true
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Return only masked encrypted data
  RETURN QUERY
  SELECT 
    w.id,
    w.created_at,
    -- Heavily mask email from encrypted version
    CASE 
      WHEN w.email_encrypted IS NOT NULL THEN 
        LEFT(public.decrypt_pii(w.email_encrypted), 2) || '****@****.' || 
        RIGHT(SPLIT_PART(public.decrypt_pii(w.email_encrypted), '.', -1), 2)
      ELSE '[ENCRYPTED]' 
    END as email_masked,
    w.restaurant_type,
    total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.email_hash = encode(digest(LOWER(search_term), 'sha256'), 'hex'))
  ORDER BY w.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;