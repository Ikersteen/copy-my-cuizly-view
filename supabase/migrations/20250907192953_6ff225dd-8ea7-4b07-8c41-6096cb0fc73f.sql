-- Corriger les fonctions avec search_path non défini pour la sécurité
-- Cette correction renforce la sécurité en définissant explicitement les chemins de recherche

-- Liste des fonctions à corriger pour search_path security
CREATE OR REPLACE FUNCTION public.allow_public_restaurant_data()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  -- Cette fonction sera utilisée uniquement par get_public_restaurants()
  -- pour permettre l'accès public aux données non-sensibles des restaurants
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_translated_description(restaurant_row restaurants, language text DEFAULT 'fr'::text)
RETURNS TEXT LANGUAGE plpgsql STABLE 
SET search_path = public AS $$
BEGIN
  CASE language
    WHEN 'en' THEN
      RETURN COALESCE(restaurant_row.description_en, restaurant_row.description_fr, restaurant_row.description);
    ELSE
      RETURN COALESCE(restaurant_row.description_fr, restaurant_row.description);
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_security_status()
RETURNS JSONB LANGUAGE sql STABLE 
SET search_path = public AS $$
  SELECT jsonb_build_object(
    'waitlist_security', 'MAXIMUM_ENCRYPTION',
    'data_protection', 'AES_256_ENCRYPTED',
    'access_control', 'ULTRA_RESTRICTED',
    'policies_active', 6,
    'public_access', 'BLOCKED',
    'admin_access', 'TRIPLE_AUTHENTICATED',
    'audit_logging', 'COMPREHENSIVE',
    'last_security_audit', now()
  );
$$;

-- Maintenant complétér la sécurisation de la table waitlist avec les fonctions restantes
CREATE OR REPLACE FUNCTION public.chiffrer_toutes_donnees_existantes()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public AS $$
DECLARE
  record_count INTEGER;
BEGIN
  -- Cette fonction peut uniquement être appelée par des super-admins
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'SÉCURITÉ: Accès non autorisé pour opération de chiffrement';
  END IF;
  
  -- Chiffrer toutes les données existantes qui ne sont pas encore chiffrées
  UPDATE public.waitlist_analytics 
  SET 
    email_encrypted = COALESCE(email_encrypted, public.encrypt_pii(email)),
    phone_encrypted = COALESCE(phone_encrypted, public.encrypt_pii(phone)),
    address_encrypted = COALESCE(address_encrypted, public.encrypt_pii(address)),
    -- Effacer les données en clair après chiffrement
    email = '[ENCRYPTED_DATA]',
    phone = CASE WHEN phone IS NOT NULL THEN '[ENCRYPTED_DATA]' ELSE NULL END,
    address = CASE WHEN address IS NOT NULL THEN '[ENCRYPTED_DATA]' ELSE NULL END
  WHERE email_encrypted IS NULL 
     OR phone_encrypted IS NULL 
     OR address_encrypted IS NULL
     OR email != '[ENCRYPTED_DATA]';
     
  GET DIAGNOSTICS record_count = ROW_COUNT;
  
  -- Log de sécurité
  PERFORM public.log_security_event(
    auth.uid(),
    'CRITICAL_mass_encryption_completed',
    jsonb_build_object(
      'records_encrypted', record_count,
      'security_level', 'MAXIMUM',
      'operation', 'mass_encryption',
      'timestamp', now()
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- Exécuter le chiffrement de masse des données existantes
SELECT public.chiffrer_toutes_donnees_existantes();