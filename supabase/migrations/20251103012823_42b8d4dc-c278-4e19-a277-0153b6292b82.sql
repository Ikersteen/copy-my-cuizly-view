-- Fonction pour nettoyer les conversations anonymes de plus de 30 jours (basé sur created_at)
CREATE OR REPLACE FUNCTION public.cleanup_expired_anonymous_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les conversations anonymes créées il y a plus de 30 jours
  -- (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  WITH deleted AS (
    DELETE FROM conversations
    WHERE user_id IS NULL 
      AND anonymous_session_id IS NOT NULL
      AND created_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log le résultat (optionnel)
  RAISE NOTICE 'Cleaned up % anonymous conversations older than 30 days', deleted_count;
END;
$$;