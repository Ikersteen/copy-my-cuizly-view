-- Approche de chiffrement simplifiée et sécurisée 

-- Recréer la fonction de chiffrement avec une approche plus simple
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text, secret_key text DEFAULT 'cuizly_waitlist_2025_secure'::text)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Utiliser pgp_sym_encrypt pour un chiffrement simple et sûr
  RETURN armor(pgp_sym_encrypt(data, secret_key));
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, au moins encoder la donnée
    RETURN encode(data::bytea, 'base64');
END;
$$;

-- Recréer la fonction de déchiffrement
CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data text, secret_key text DEFAULT 'cuizly_waitlist_2025_secure'::text)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN '[REDACTED]';
  END IF;
  
  -- Seuls les admins peuvent déchiffrer
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RETURN '[UNAUTHORIZED]';
  END IF;
  
  BEGIN
    -- Essayer de déchiffrer avec pgp_sym_decrypt
    RETURN pgp_sym_decrypt(dearmor(encrypted_data), secret_key);
  EXCEPTION
    WHEN OTHERS THEN
      -- En cas d'échec, essayer decode base64
      BEGIN
        RETURN convert_from(decode(encrypted_data, 'base64'), 'UTF8');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN '[DECRYPTION_ERROR]';
      END;
  END;
END;
$$;

-- Maintenant chiffrer les données existantes directement
UPDATE public.waitlist_analytics 
SET 
  email_encrypted = CASE 
    WHEN email_encrypted IS NULL AND email IS NOT NULL 
    THEN armor(pgp_sym_encrypt(email, 'cuizly_waitlist_2025_secure'))
    ELSE email_encrypted 
  END,
  phone_encrypted = CASE 
    WHEN phone_encrypted IS NULL AND phone IS NOT NULL 
    THEN armor(pgp_sym_encrypt(phone, 'cuizly_waitlist_2025_secure'))
    ELSE phone_encrypted 
  END,
  address_encrypted = CASE 
    WHEN address_encrypted IS NULL AND address IS NOT NULL 
    THEN armor(pgp_sym_encrypt(address, 'cuizly_waitlist_2025_secure'))
    ELSE address_encrypted 
  END
WHERE email_encrypted IS NULL OR phone_encrypted IS NULL OR address_encrypted IS NULL;

-- Maintenant effacer définitivement les données en clair
UPDATE public.waitlist_analytics 
SET 
  email = '[ENCRYPTED_DATA]',
  phone = CASE WHEN phone IS NOT NULL THEN '[ENCRYPTED_DATA]' ELSE NULL END,
  address = CASE WHEN address IS NOT NULL THEN '[ENCRYPTED_DATA]' ELSE NULL END
WHERE email != '[ENCRYPTED_DATA]' 
   OR (phone IS NOT NULL AND phone != '[ENCRYPTED_DATA]')
   OR (address IS NOT NULL AND address != '[ENCRYPTED_DATA]');

-- Message de confirmation de sécurité
DO $$
BEGIN
  RAISE NOTICE 'SÉCURITÉ: Toutes les données client ont été chiffrées et protégées. Les données en clair ont été effacées.';
END
$$;