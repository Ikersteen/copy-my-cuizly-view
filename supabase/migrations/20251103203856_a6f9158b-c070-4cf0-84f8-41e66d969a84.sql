-- Mettre à jour la fonction pour supprimer les conversations anonymes après 24h
CREATE OR REPLACE FUNCTION public.cleanup_expired_anonymous_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les conversations anonymes créées il y a plus de 24 heures
  -- (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  WITH deleted AS (
    DELETE FROM conversations
    WHERE user_id IS NULL 
      AND anonymous_session_id IS NOT NULL
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log le résultat
  RAISE NOTICE 'Cleaned up % anonymous conversations older than 24 hours', deleted_count;
END;
$function$;