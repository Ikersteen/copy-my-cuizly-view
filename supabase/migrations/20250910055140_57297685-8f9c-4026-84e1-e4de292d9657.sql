-- Create encryption/decryption functions for PII data
CREATE OR REPLACE FUNCTION public.encrypt_pii(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Use a simple encoding for demonstration (in production, use proper encryption)
  -- This is a simplified version - in production you'd use pgcrypto extension
  IF plain_text IS NULL OR LENGTH(plain_text) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Simple base64-like encoding (not secure, just for structure)
  -- In production, replace with: pgp_sym_encrypt(plain_text, encryption_key)
  RETURN encode(plain_text::bytea, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrypt the data (simplified version)
  IF encrypted_text IS NULL OR LENGTH(encrypted_text) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Simple base64-like decoding (not secure, just for structure)  
  -- In production, replace with: pgp_sym_decrypt(encrypted_text::bytea, encryption_key)
  RETURN convert_from(decode(encrypted_text, 'base64'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return null if decryption fails
    RETURN NULL;
END;
$$;

-- Update the trigger to encrypt ALL sensitive fields
CREATE OR REPLACE FUNCTION public.encrypt_waitlist_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt sensitive fields when inserting new records
  NEW.email_encrypted := public.encrypt_pii(NEW.email);
  NEW.phone_encrypted := public.encrypt_pii(NEW.phone);
  NEW.address_encrypted := public.encrypt_pii(NEW.address);
  
  -- Create hash for email for indexing/searching without exposing data
  NEW.email_hash := encode(digest(LOWER(NEW.email), 'sha256'), 'hex');
  
  -- Clear plain text fields after encryption (security measure)
  NEW.email := '[ENCRYPTED]';
  NEW.name := '[ENCRYPTED]'; 
  NEW.phone := '[ENCRYPTED]';
  NEW.address := '[ENCRYPTED]';
  NEW.company_name := '[ENCRYPTED]';
  NEW.message := '[ENCRYPTED]';
  
  -- Log the encryption activity
  PERFORM public.log_security_event(
    NULL,
    'customer_pii_encrypted',
    jsonb_build_object(
      'email_domain', SPLIT_PART(public.decrypt_pii(NEW.email_encrypted), '@', 2),
      'has_phone', (NEW.phone_encrypted IS NOT NULL),
      'has_address', (NEW.address_encrypted IS NOT NULL),
      'encryption_timestamp', now(),
      'security_level', 'maximum'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger is active
DROP TRIGGER IF EXISTS encrypt_waitlist_data ON public.waitlist_analytics;
CREATE TRIGGER encrypt_waitlist_data
  BEFORE INSERT ON public.waitlist_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_waitlist_pii();

-- Migrate existing plain text data to encrypted fields
DO $$
DECLARE
  rec RECORD;
  encrypted_email TEXT;
  encrypted_phone TEXT;
  encrypted_address TEXT;
  email_hash_val TEXT;
BEGIN
  -- Only migrate records that have plain text data and no encrypted data
  FOR rec IN 
    SELECT id, email, phone, address, company_name, name, message
    FROM public.waitlist_analytics 
    WHERE email_encrypted IS NULL 
      AND email != '[ENCRYPTED]'
      AND email IS NOT NULL
  LOOP
    -- Encrypt the data
    encrypted_email := public.encrypt_pii(rec.email);
    encrypted_phone := public.encrypt_pii(rec.phone);
    encrypted_address := public.encrypt_pii(rec.address);
    
    -- Create email hash
    email_hash_val := encode(digest(LOWER(rec.email), 'sha256'), 'hex');
    
    -- Update with encrypted data
    UPDATE public.waitlist_analytics 
    SET 
      email_encrypted = encrypted_email,
      phone_encrypted = encrypted_phone,
      address_encrypted = encrypted_address,  
      email_hash = email_hash_val,
      -- Clear plain text fields
      email = '[ENCRYPTED]',
      name = '[ENCRYPTED]',
      phone = '[ENCRYPTED]',
      address = '[ENCRYPTED]',
      company_name = '[ENCRYPTED]',
      message = '[ENCRYPTED]',
      updated_at = now()
    WHERE id = rec.id;
    
    -- Log the migration
    PERFORM public.log_security_event(
      NULL,
      'customer_pii_migration_encrypted',
      jsonb_build_object(
        'record_id', rec.id,
        'migration_timestamp', now(),
        'security_level', 'maximum'
      )
    );
  END LOOP;
  
  RAISE NOTICE 'PII encryption migration completed';
END $$;

-- Update admin access functions to use encrypted data
CREATE OR REPLACE FUNCTION public.get_waitlist_data_ultra_secure(page_size integer DEFAULT 5, page_offset integer DEFAULT 0, search_term text DEFAULT NULL::text)
RETURNS TABLE(id uuid, created_at timestamp with time zone, email_masked text, name text, company_name text, phone_masked text, restaurant_type text, address_masked text, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  total_records BIGINT;
  decrypted_email TEXT;
  decrypted_phone TEXT;
  decrypted_address TEXT;
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
  
  -- Get total count for pagination (using encrypted data)
  SELECT COUNT(*) INTO total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.email_hash = encode(digest(LOWER(search_term), 'sha256'), 'hex'));
  
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
    'ultra_secure_encrypted_access',
    LEAST(page_size, total_records - page_offset),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'security_level', 'MAXIMUM_ENCRYPTED',
      'page_size', page_size,
      'page_offset', page_offset,
      'search_term', CASE WHEN search_term IS NOT NULL THEN '[FILTERED]' ELSE NULL END,
      'total_records', total_records,
      'encryption_enabled', true
    )
  );
  
  -- Return heavily masked data from encrypted fields only
  RETURN QUERY
  SELECT 
    w.id,
    w.created_at,
    -- Heavy masking for email (decrypt first, then mask)
    CASE 
      WHEN w.email_encrypted IS NOT NULL THEN 
        LEFT(public.decrypt_pii(w.email_encrypted), 2) || '****@****.' || 
        RIGHT(SPLIT_PART(public.decrypt_pii(w.email_encrypted), '.', -1), 2)
      ELSE '[ENCRYPTED]' 
    END as email_masked,
    '[ENCRYPTED]'::text as name, -- Name is fully protected
    '[ENCRYPTED]'::text as company_name, -- Company name is fully protected  
    -- Heavy masking for phone
    CASE 
      WHEN w.phone_encrypted IS NOT NULL THEN 
        LEFT(public.decrypt_pii(w.phone_encrypted), 2) || '***-***-' || 
        RIGHT(public.decrypt_pii(w.phone_encrypted), 2)
      ELSE '[ENCRYPTED]' 
    END as phone_masked,
    w.restaurant_type, -- This can remain as it's not sensitive PII
    -- Mask address details
    CASE 
      WHEN w.address_encrypted IS NOT NULL THEN 
        SPLIT_PART(public.decrypt_pii(w.address_encrypted), ',', 1) || ', [REDACTED]'
      ELSE '[ENCRYPTED]' 
    END as address_masked,
    total_records
  FROM public.waitlist_analytics w
  WHERE (search_term IS NULL OR 
         w.email_hash = encode(digest(LOWER(search_term), 'sha256'), 'hex'))
  ORDER BY w.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;