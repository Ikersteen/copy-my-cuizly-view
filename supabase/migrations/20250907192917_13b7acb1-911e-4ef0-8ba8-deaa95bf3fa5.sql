-- Activer l'extension de cryptographie PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Vérifier et corriger la fonction de chiffrement
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text, secret_key text DEFAULT 'cuizly_waitlist_2025_secure'::text)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Utiliser le chiffrement AES avec IV aléatoire (pgcrypto activé)
  RETURN encode(
    encrypt_iv(
      data::bytea, 
      digest(secret_key::text, 'sha256'::text)::bytea,
      gen_random_bytes(16)
    ), 
    'base64'
  );
END;
$$;

-- Corriger aussi la fonction de déchiffrement
CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data text, secret_key text DEFAULT 'cuizly_waitlist_2025_secure'::text)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN '[REDACTED]';
  END IF;
  
  -- Seuls les admins peuvent déchiffrer - vérification de sécurité supplémentaire
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RETURN '[UNAUTHORIZED]';
  END IF;
  
  BEGIN
    RETURN convert_from(
      decrypt_iv(
        decode(encrypted_data, 'base64'),
        digest(secret_key::text, 'sha256'::text)::bytea,
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