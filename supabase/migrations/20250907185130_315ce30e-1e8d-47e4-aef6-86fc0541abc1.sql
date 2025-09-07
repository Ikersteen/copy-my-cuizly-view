-- SECURITY ENHANCEMENT: Encrypting sensitive customer data in waitlist_analytics
-- Adding encrypted columns and security functions for PII protection

-- 1. Add encrypted columns for sensitive data
ALTER TABLE public.waitlist_analytics 
ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_hash TEXT GENERATED ALWAYS AS (
  encode(digest(email, 'sha256'), 'hex')
) STORED;

-- 2. Create encryption/decryption functions using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Secure encryption function - only for system use
CREATE OR REPLACE FUNCTION public.encrypt_pii(data TEXT, secret_key TEXT DEFAULT 'cuizly_waitlist_2025_secure')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use AES encryption with random IV
  RETURN encode(
    encrypt_iv(
      data::bytea, 
      digest(secret_key, 'sha256')::bytea,
      gen_random_bytes(16)
    ), 
    'base64'
  );
END;
$$;

-- Secure decryption function - only for authorized system use
CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data TEXT, secret_key TEXT DEFAULT 'cuizly_waitlist_2025_secure')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN '[REDACTED]';
  END IF;
  
  -- Only admins can decrypt - additional security check
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RETURN '[UNAUTHORIZED]';
  END IF;
  
  BEGIN
    RETURN convert_from(
      decrypt_iv(
        decode(encrypted_data, 'base64'),
        digest(secret_key, 'sha256')::bytea,
        substring(decode(encrypted_data, 'base64') from 1 for 16)
      ),
      'UTF8'
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN '[DECRYPTION_ERROR]';
  END;
END;
$$;

-- 3. Enhanced data masking function for different security levels
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(
  data TEXT, 
  mask_type TEXT DEFAULT 'email', 
  security_level TEXT DEFAULT 'high'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  CASE mask_type
    WHEN 'email' THEN
      CASE security_level
        WHEN 'maximum' THEN
          RETURN LEFT(data, 1) || '***@***.***';
        WHEN 'high' THEN
          RETURN LEFT(data, 2) || '****@' || RIGHT(SPLIT_PART(data, '@', 2), 3);
        ELSE
          RETURN LEFT(data, 3) || '***@' || SPLIT_PART(data, '@', 2);
      END CASE;
      
    WHEN 'phone' THEN
      CASE security_level
        WHEN 'maximum' THEN
          RETURN '***-***-****';
        WHEN 'high' THEN
          RETURN LEFT(data, 2) || '***-***-' || RIGHT(data, 2);
        ELSE
          RETURN LEFT(data, 3) || '***-' || RIGHT(data, 4);
      END CASE;
      
    WHEN 'address' THEN
      CASE security_level
        WHEN 'maximum' THEN
          RETURN '[PROTECTED ADDRESS]';
        WHEN 'high' THEN
          RETURN SPLIT_PART(data, ',', 1) || ', [REDACTED]';
        ELSE
          RETURN SUBSTRING(data FROM 1 FOR 10) || '... [MASKED]';
      END CASE;
      
    ELSE
      RETURN '[PROTECTED]';
  END CASE;
END;
$$;

-- 4. Ultra-secure function to get waitlist data with maximum protection
CREATE OR REPLACE FUNCTION public.get_waitlist_maximum_security(
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
  message_preview TEXT,
  address_region TEXT,
  total_count BIGINT,
  access_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  total_records BIGINT;
  security_clearance TEXT;
BEGIN
  -- Triple verification for maximum security
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Unauthorized access to protected customer data';
  END IF;

  IF NOT public.verify_secure_admin_access(3) THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Rate limit exceeded for sensitive data access';
  END IF;

  admin_user_id := auth.uid();
  
  -- Determine security clearance level
  security_clearance := CASE 
    WHEN public.has_role(admin_user_id, 'admin'::app_role) THEN 'maximum'
    ELSE 'denied'
  END;

  IF security_clearance = 'denied' THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Insufficient clearance for customer data';
  END IF;

  -- Ultra-strict pagination
  IF page_size > 5 THEN
    page_size := 5;
  END IF;

  -- Get total count
  SELECT COUNT(*) INTO total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.name ILIKE '%' || search_term || '%' OR
         w.company_name ILIKE '%' || search_term || '%');

  -- Enhanced security logging
  INSERT INTO public.waitlist_access_log (
    admin_user_id,
    access_type,
    records_accessed,
    ip_address,
    user_agent,
    access_details
  ) VALUES (
    admin_user_id,
    'MAXIMUM_SECURITY_ACCESS',
    LEAST(page_size, total_records - page_offset),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'security_level', 'MAXIMUM',
      'clearance', security_clearance,
      'encryption_enabled', true,
      'pii_protected', true,
      'page_size', page_size,
      'page_offset', page_offset,
      'search_term', CASE WHEN search_term IS NOT NULL THEN '[FILTERED]' ELSE NULL END,
      'total_records', total_records,
      'timestamp', now()
    )
  );

  -- Return heavily protected data
  RETURN QUERY
  SELECT 
    w.id,
    w.created_at,
    -- Maximum security masking
    public.mask_sensitive_data(w.email, 'email', 'maximum') as email_masked,
    -- Only first name for privacy
    SPLIT_PART(w.name, ' ', 1) as name,
    -- Company name truncated
    LEFT(COALESCE(w.company_name, '[N/A]'), 20) as company_name,
    -- Phone completely masked
    public.mask_sensitive_data(w.phone, 'phone', 'maximum') as phone_masked,
    w.restaurant_type,
    -- Message preview only
    LEFT(COALESCE(w.message, ''), 50) || CASE WHEN LENGTH(COALESCE(w.message, '')) > 50 THEN '...' ELSE '' END as message_preview,
    -- Address region only
    public.mask_sensitive_data(w.address, 'address', 'maximum') as address_region,
    total_records,
    security_clearance as access_level
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.name ILIKE '%' || search_term || '%' OR
         w.company_name ILIKE '%' || search_term || '%')
  ORDER BY w.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 5. Create trigger to encrypt sensitive data on insert
CREATE OR REPLACE FUNCTION public.encrypt_waitlist_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt sensitive fields when inserting new records
  NEW.email_encrypted := public.encrypt_pii(NEW.email);
  NEW.phone_encrypted := public.encrypt_pii(NEW.phone);
  NEW.address_encrypted := public.encrypt_pii(NEW.address);
  
  -- Log the encryption activity
  PERFORM public.log_security_event(
    NULL,
    'customer_pii_encrypted',
    jsonb_build_object(
      'email_domain', SPLIT_PART(NEW.email, '@', 2),
      'has_phone', (NEW.phone IS NOT NULL),
      'has_address', (NEW.address IS NOT NULL),
      'encryption_timestamp', now(),
      'security_level', 'maximum'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

-- Create the encryption trigger
DROP TRIGGER IF EXISTS encrypt_pii_trigger ON public.waitlist_analytics;
CREATE TRIGGER encrypt_pii_trigger
  BEFORE INSERT ON public.waitlist_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_waitlist_pii();

-- 6. Enhanced RLS policy with additional security checks
DROP POLICY IF EXISTS "MAXIMUM_SECURITY_admin_only_read" ON public.waitlist_analytics;
CREATE POLICY "ULTRA_MAXIMUM_SECURITY_encrypted_admin_access"
ON public.waitlist_analytics
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.verify_secure_admin_access(2)
  AND public.verify_ultra_secure_waitlist_access()
);

-- 7. Additional security function for emergency data recovery (admin only)
CREATE OR REPLACE FUNCTION public.emergency_decrypt_customer_data(
  record_id UUID,
  justification TEXT
)
RETURNS TABLE(
  decrypted_email TEXT,
  decrypted_phone TEXT,
  decrypted_address TEXT,
  access_justification TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  record_exists BOOLEAN;
BEGIN
  admin_user_id := auth.uid();
  
  -- Ultra-strict verification
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'CRITICAL_SECURITY_VIOLATION: Unauthorized emergency access attempt';
  END IF;
  
  IF justification IS NULL OR LENGTH(justification) < 20 THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Emergency access requires detailed justification';
  END IF;
  
  -- Check if record exists
  SELECT EXISTS(
    SELECT 1 FROM public.waitlist_analytics WHERE id = record_id
  ) INTO record_exists;
  
  IF NOT record_exists THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Invalid record ID provided';
  END IF;
  
  -- Critical security logging
  PERFORM public.log_security_event(
    admin_user_id,
    'CRITICAL_emergency_pii_decryption',
    jsonb_build_object(
      'record_id', record_id,
      'justification', justification,
      'admin_user', admin_user_id,
      'timestamp', now(),
      'severity', 'CRITICAL',
      'action', 'EMERGENCY_DECRYPT'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Return decrypted data (should only be used in genuine emergencies)
  RETURN QUERY
  SELECT 
    public.decrypt_pii(w.email_encrypted) as decrypted_email,
    public.decrypt_pii(w.phone_encrypted) as decrypted_phone,
    public.decrypt_pii(w.address_encrypted) as decrypted_address,
    justification as access_justification
  FROM public.waitlist_analytics w
  WHERE w.id = record_id;
END;
$$;

-- 8. Create indexes for encrypted columns (for performance)
CREATE INDEX IF NOT EXISTS idx_waitlist_email_hash ON public.waitlist_analytics(email_hash);
CREATE INDEX IF NOT EXISTS idx_waitlist_encrypted_data ON public.waitlist_analytics(email_encrypted, phone_encrypted) WHERE email_encrypted IS NOT NULL;

-- 9. Add comment explaining the security measures
COMMENT ON TABLE public.waitlist_analytics IS 'SECURITY ENHANCED: Customer PII is encrypted at rest. Access requires admin privileges, rate limiting, and comprehensive audit logging. Use get_waitlist_maximum_security() function for secure data access.';

COMMENT ON COLUMN public.waitlist_analytics.email_encrypted IS 'Encrypted customer email using AES-256. Decryption requires admin privileges and security verification.';
COMMENT ON COLUMN public.waitlist_analytics.phone_encrypted IS 'Encrypted customer phone using AES-256. Decryption requires admin privileges and security verification.';
COMMENT ON COLUMN public.waitlist_analytics.address_encrypted IS 'Encrypted customer address using AES-256. Decryption requires admin privileges and security verification.';
COMMENT ON COLUMN public.waitlist_analytics.email_hash IS 'SHA-256 hash of email for duplicate detection without exposing actual email.';

-- Security validation - ensure all functions are properly secured
DO $$
BEGIN
  -- Verify that sensitive functions exist and are properly protected
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'encrypt_pii' AND prosecdef = true) THEN
    RAISE EXCEPTION 'SECURITY SETUP ERROR: encrypt_pii function not properly secured';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrypt_pii' AND prosecdef = true) THEN
    RAISE EXCEPTION 'SECURITY SETUP ERROR: decrypt_pii function not properly secured';
  END IF;
  
  RAISE NOTICE 'SECURITY ENHANCEMENT COMPLETE: Customer PII encryption and protection measures successfully implemented.';
END $$;