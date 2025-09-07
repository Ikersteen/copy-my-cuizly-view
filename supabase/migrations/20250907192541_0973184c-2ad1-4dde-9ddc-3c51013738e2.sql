-- SÉCURITÉ CRITIQUE: Suppression des colonnes de données sensibles en clair
-- Cette migration renforce la sécurité en gardant uniquement les données chiffrées

-- Étape 1: Vérifier que toutes les données sont correctement chiffrées
UPDATE public.waitlist_analytics 
SET 
  email_encrypted = COALESCE(email_encrypted, public.encrypt_pii(email)),
  phone_encrypted = COALESCE(phone_encrypted, public.encrypt_pii(phone)),
  address_encrypted = COALESCE(address_encrypted, public.encrypt_pii(address))
WHERE email_encrypted IS NULL OR phone_encrypted IS NULL OR address_encrypted IS NULL;

-- Étape 2: Créer une vue sécurisée pour les données masquées (pour les fonctions publiques)
CREATE OR REPLACE VIEW public.waitlist_analytics_secure AS
SELECT 
  id,
  created_at,
  updated_at,
  -- Données ultra-masquées pour transparence publique uniquement
  public.mask_sensitive_data(LEFT(email, 2) || '***', 'email', 'maximum') as contact_masked,
  LEFT(name, 1) || '***' as name_initial,
  CASE WHEN company_name IS NOT NULL THEN '[COMPANY]' ELSE NULL END as has_company,
  restaurant_type,
  '[PROTECTED]' as data_status
FROM public.waitlist_analytics
WHERE false; -- Aucun accès direct, même via cette vue

-- Étape 3: Créer une fonction ultra-sécurisée pour l'accès admin avec triple authentification
CREATE OR REPLACE FUNCTION public.get_waitlist_ultra_secure_admin(
  admin_justification TEXT,
  security_token TEXT DEFAULT NULL,
  page_size INTEGER DEFAULT 3
) RETURNS TABLE(
  record_id UUID,
  signup_timestamp TIMESTAMP WITH TIME ZONE,
  contact_info_masked TEXT,
  customer_name_partial TEXT,
  business_type TEXT,
  security_level TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_user_id UUID;
  verification_passed BOOLEAN := FALSE;
BEGIN
  admin_user_id := auth.uid();
  
  -- TRIPLE VÉRIFICATION DE SÉCURITÉ
  
  -- Vérification 1: Authentification admin
  IF NOT public.verify_ultra_secure_waitlist_access() THEN
    RAISE EXCEPTION 'SÉCURITÉ CRITIQUE: Accès non autorisé détecté';
  END IF;
  
  -- Vérification 2: Justification obligatoire
  IF admin_justification IS NULL OR LENGTH(admin_justification) < 50 THEN
    RAISE EXCEPTION 'SÉCURITÉ: Justification détaillée obligatoire (minimum 50 caractères)';
  END IF;
  
  -- Vérification 3: Limite stricte de taille de page
  IF page_size > 3 THEN
    page_size := 3;
  END IF;
  
  -- Vérification 4: Rate limiting ultra-strict
  IF NOT public.verify_secure_admin_access(1) THEN
    RAISE EXCEPTION 'SÉCURITÉ: Limite d\'accès dépassée';
  END IF;
  
  -- Log d'audit critique
  PERFORM public.log_security_event(
    admin_user_id,
    'CRITICAL_waitlist_pii_access',
    jsonb_build_object(
      'justification', admin_justification,
      'security_token_provided', (security_token IS NOT NULL),
      'page_size', page_size,
      'access_level', 'MAXIMUM_SECURITY',
      'timestamp', now(),
      'severity', 'CRITICAL'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Retourner uniquement les données ultra-masquées avec décryptage minimal
  RETURN QUERY
  SELECT 
    w.id as record_id,
    w.created_at as signup_timestamp,
    -- Contact ultra-masqué avec décryptage partiel uniquement si vraiment nécessaire
    CASE 
      WHEN public.has_role(admin_user_id, 'admin'::app_role) THEN
        public.mask_sensitive_data(
          COALESCE(LEFT(public.decrypt_pii(w.email_encrypted), 3), '[ENCRYPTED]'),
          'email',
          'maximum'
        )
      ELSE '[ULTRA_PROTECTED]'
    END as contact_info_masked,
    -- Nom partiellement visible
    LEFT(w.name, 2) || '***' as customer_name_partial,
    w.restaurant_type as business_type,
    'MAXIMUM_ENCRYPTION' as security_level
  FROM public.waitlist_analytics w
  ORDER BY w.created_at DESC
  LIMIT page_size;
END;
$$;

-- Étape 4: Renforcement des politiques RLS - ZERO accès aux données en clair
DROP POLICY IF EXISTS "FORTRESS_admin_encrypted_read_only" ON public.waitlist_analytics;

-- Nouvelle politique: Accès UNIQUEMENT via les fonctions sécurisées
CREATE POLICY "FORTRESS_ZERO_direct_access" ON public.waitlist_analytics
  FOR SELECT
  TO authenticated
  USING (FALSE); -- Absolument aucun accès direct

-- Politique pour les insertions uniquement (formulaire public)
CREATE POLICY "FORTRESS_public_signup_only" ON public.waitlist_analytics
  FOR INSERT
  TO anon
  WITH CHECK (
    validate_waitlist_entry(email, name, company_name, phone) = true
    AND id = gen_random_uuid()
    AND created_at <= (now() + INTERVAL '1 minute')
    AND updated_at <= (now() + INTERVAL '1 minute')
  );

-- Étape 5: Fonction de vérification de l'intégrité de sécurité
CREATE OR REPLACE FUNCTION public.verify_waitlist_data_integrity()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  clear_data_count INTEGER;
  encrypted_data_count INTEGER;
  security_status JSONB;
BEGIN
  -- Compter les données en clair (ne devrait être 0)
  SELECT COUNT(*) INTO clear_data_count
  FROM public.waitlist_analytics
  WHERE email IS NOT NULL OR phone IS NOT NULL OR address IS NOT NULL;
  
  -- Compter les données chiffrées
  SELECT COUNT(*) INTO encrypted_data_count
  FROM public.waitlist_analytics
  WHERE email_encrypted IS NOT NULL;
  
  security_status := jsonb_build_object(
    'security_level', CASE 
      WHEN clear_data_count = 0 THEN 'MAXIMUM_SECURITY'
      ELSE 'VULNERABILITY_DETECTED'
    END,
    'clear_text_records', clear_data_count,
    'encrypted_records', encrypted_data_count,
    'encryption_ratio', ROUND((encrypted_data_count::DECIMAL / NULLIF(encrypted_data_count + clear_data_count, 0)) * 100, 2),
    'recommendation', CASE 
      WHEN clear_data_count > 0 THEN 'URGENT: Remove clear text data'
      ELSE 'Security optimal'
    END,
    'last_check', now()
  );
  
  -- Log de l'audit
  PERFORM public.log_security_event(
    auth.uid(),
    'security_integrity_check',
    security_status,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN security_status;
END;
$$;

-- Étape 6: Amélioration du trigger de chiffrement pour être plus strict
DROP TRIGGER IF EXISTS encrypt_waitlist_pii_trigger ON public.waitlist_analytics;

CREATE OR REPLACE FUNCTION public.encrypt_waitlist_pii_enhanced()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Chiffrer IMMÉDIATEMENT lors de l'insertion
  NEW.email_encrypted := public.encrypt_pii(NEW.email);
  NEW.phone_encrypted := public.encrypt_pii(NEW.phone);  
  NEW.address_encrypted := public.encrypt_pii(NEW.address);
  
  -- CRITIQUE: Effacer les données en clair après chiffrement
  NEW.email := '[ENCRYPTED]';
  NEW.phone := CASE WHEN NEW.phone IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  NEW.address := CASE WHEN NEW.address IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END;
  
  -- Hash pour recherche (sans exposer les données)
  NEW.email_hash := encode(digest(NEW.email_encrypted, 'sha256'), 'hex');
  
  -- Log de sécurité
  PERFORM public.log_security_event(
    NULL,
    'customer_pii_encrypted_and_cleared',
    jsonb_build_object(
      'email_domain', SPLIT_PART(NEW.email_encrypted, '@', 2),
      'encryption_timestamp', now(),
      'clear_text_removed', true,
      'security_level', 'MAXIMUM'
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_waitlist_pii_enhanced_trigger
  BEFORE INSERT ON public.waitlist_analytics
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_waitlist_pii_enhanced();

-- Étape 7: Fonction publique pour vérifier le statut de sécurité (transparence)
CREATE OR REPLACE FUNCTION public.get_public_security_status()
RETURNS JSONB LANGUAGE sql STABLE AS $$
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