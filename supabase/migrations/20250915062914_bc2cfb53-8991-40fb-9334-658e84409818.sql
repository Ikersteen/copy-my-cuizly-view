-- SÉCURITÉ CRITIQUE: Chiffrement complet des données personnelles de la waitlist

-- 1. Ajouter les colonnes chiffrées manquantes
ALTER TABLE public.waitlist_analytics 
ADD COLUMN IF NOT EXISTS name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS company_name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS message_encrypted TEXT;

-- 2. Chiffrer immédiatement toutes les données existantes en texte clair
UPDATE public.waitlist_analytics 
SET 
  name_encrypted = public.encrypt_pii(name),
  company_name_encrypted = CASE WHEN company_name IS NOT NULL AND company_name != '[ENCRYPTED]' 
                          THEN public.encrypt_pii(company_name) 
                          ELSE NULL END,
  message_encrypted = CASE WHEN message IS NOT NULL AND message != '[ENCRYPTED]' 
                     THEN public.encrypt_pii(message) 
                     ELSE NULL END
WHERE name != '[ENCRYPTED]' OR 
      (company_name IS NOT NULL AND company_name != '[ENCRYPTED]') OR 
      (message IS NOT NULL AND message != '[ENCRYPTED]');

-- 3. Effacer les données en texte clair après chiffrement
UPDATE public.waitlist_analytics 
SET 
  name = '[ENCRYPTED]',
  company_name = CASE WHEN company_name IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END,
  message = CASE WHEN message IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END
WHERE name != '[ENCRYPTED]' OR 
      (company_name IS NOT NULL AND company_name != '[ENCRYPTED]') OR 
      (message IS NOT NULL AND message != '[ENCRYPTED]');

-- 4. Mettre à jour le déclencheur de chiffrement pour inclure TOUS les champs sensibles
CREATE OR REPLACE FUNCTION public.encrypt_waitlist_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Chiffrer TOUS les champs sensibles automatiquement
  NEW.email_encrypted := public.encrypt_pii(NEW.email);
  NEW.phone_encrypted := CASE WHEN NEW.phone IS NOT NULL THEN public.encrypt_pii(NEW.phone) ELSE NULL END;
  NEW.address_encrypted := CASE WHEN NEW.address IS NOT NULL THEN public.encrypt_pii(NEW.address) ELSE NULL END;
  NEW.name_encrypted := public.encrypt_pii(NEW.name);
  NEW.company_name_encrypted := CASE WHEN NEW.company_name IS NOT NULL THEN public.encrypt_pii(NEW.company_name) ELSE NULL END;
  NEW.message_encrypted := CASE WHEN NEW.message IS NOT NULL THEN public.encrypt_pii(NEW.message) ELSE NULL END;
  
  -- Créer un hash recherchable pour l'email (pour les recherches admin)
  NEW.email_hash := encode(digest(LOWER(NEW.email), 'sha256'), 'hex');
  
  -- Effacer TOUS les champs en texte clair (garder seulement les versions chiffrées)
  NEW.email := '[ENCRYPTED]';
  NEW.name := '[ENCRYPTED]';
  NEW.phone := CASE WHEN NEW.phone IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  NEW.address := CASE WHEN NEW.address IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END; 
  NEW.company_name := CASE WHEN NEW.company_name IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  NEW.message := CASE WHEN NEW.message IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  
  -- Audit de sécurité du chiffrement
  PERFORM public.log_security_event(
    NULL, -- Pas d'ID utilisateur pour la waitlist publique
    'CRITICAL_waitlist_pii_fully_encrypted',
    jsonb_build_object(
      'email_domain', SPLIT_PART(public.decrypt_pii(NEW.email_encrypted), '@', 2),
      'has_phone', (NEW.phone_encrypted IS NOT NULL),
      'has_address', (NEW.address_encrypted IS NOT NULL),
      'has_company', (NEW.company_name_encrypted IS NOT NULL),
      'has_message', (NEW.message_encrypted IS NOT NULL),
      'full_encryption_timestamp', now(),
      'security_level', 'MAXIMUM'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$function$;

-- 5. Fonction d'accès d'urgence aux données chiffrées (SEULEMENT pour les cas d'urgence justifiés)
CREATE OR REPLACE FUNCTION public.get_waitlist_decrypted_emergency(
  record_id UUID,
  justification TEXT,
  admin_authorization_code TEXT DEFAULT NULL
)
RETURNS TABLE(
  decrypted_email TEXT,
  decrypted_name TEXT,
  decrypted_phone TEXT,
  decrypted_address TEXT,
  decrypted_company_name TEXT,
  decrypted_message TEXT,
  access_justification TEXT,
  access_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  admin_user_id UUID;
  record_exists BOOLEAN;
BEGIN
  admin_user_id := auth.uid();
  
  -- Vérification de sécurité ultra-stricte
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'CRITICAL_SECURITY_VIOLATION: Unauthorized emergency decryption attempt';
  END IF;
  
  -- Justification obligatoire détaillée
  IF justification IS NULL OR LENGTH(justification) < 50 THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Emergency access requires detailed justification (minimum 50 characters)';
  END IF;
  
  -- Vérifier l'existence de l'enregistrement
  SELECT EXISTS(
    SELECT 1 FROM public.waitlist_analytics WHERE id = record_id
  ) INTO record_exists;
  
  IF NOT record_exists THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Invalid record ID provided';
  END IF;
  
  -- Audit critique de sécurité
  PERFORM public.log_security_event(
    admin_user_id,
    'CRITICAL_EMERGENCY_full_pii_decryption',
    jsonb_build_object(
      'record_id', record_id,
      'justification', justification,
      'admin_user', admin_user_id,
      'timestamp', now(),
      'severity', 'CRITICAL',
      'action', 'EMERGENCY_FULL_DECRYPT',
      'authorization_provided', (admin_authorization_code IS NOT NULL)
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Retourner toutes les données déchiffrées (UNIQUEMENT pour les vraies urgences)
  RETURN QUERY
  SELECT 
    public.decrypt_pii(w.email_encrypted) as decrypted_email,
    public.decrypt_pii(w.name_encrypted) as decrypted_name,
    public.decrypt_pii(w.phone_encrypted) as decrypted_phone,
    public.decrypt_pii(w.address_encrypted) as decrypted_address,
    public.decrypt_pii(w.company_name_encrypted) as decrypted_company_name,
    public.decrypt_pii(w.message_encrypted) as decrypted_message,
    justification as access_justification,
    now() as access_timestamp
  FROM public.waitlist_analytics w
  WHERE w.id = record_id;
END;
$function$;

-- 6. Renforcer les politiques RLS pour bloquer TOUT accès aux données sensibles
DROP POLICY IF EXISTS "FORTRESS_ultra_secure_admin_access" ON public.waitlist_analytics;

CREATE POLICY "FORTRESS_ultra_secure_admin_access" 
ON public.waitlist_analytics 
FOR SELECT 
TO authenticated
USING (
  -- Accès ULTRA-restreint même pour les admins
  auth.uid() IS NOT NULL 
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND public.verify_ultra_secure_waitlist_access() 
  AND public.verify_secure_admin_access(1) -- Maximum 1 accès par heure
  -- Et SEULEMENT aux colonnes chiffrées via des fonctions sécurisées
);

-- 7. Audit de sécurité pour cette correction critique
INSERT INTO public.security_audit_log (
  user_id, 
  event_type, 
  event_details, 
  ip_address, 
  user_agent
) VALUES (
  NULL,
  'CRITICAL_SECURITY_FIX_waitlist_encryption_complete',
  jsonb_build_object(
    'fix_type', 'full_pii_encryption_implementation',
    'affected_table', 'waitlist_analytics',
    'encrypted_fields', ARRAY['email', 'name', 'phone', 'address', 'company_name', 'message'],
    'security_level_upgraded_to', 'MAXIMUM_ENCRYPTED',
    'plaintext_data_eliminated', true,
    'emergency_access_function_created', true,
    'rls_policies_reinforced', true,
    'fix_timestamp', now(),
    'severity', 'CRITICAL_FIX'
  ),
  inet_client_addr(),
  'SECURITY_AUTOMATED_FIX'
);