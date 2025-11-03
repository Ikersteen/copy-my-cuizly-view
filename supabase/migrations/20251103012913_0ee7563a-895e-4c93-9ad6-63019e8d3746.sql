-- Activer les extensions nécessaires pour les tâches planifiées
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Planifier le nettoyage quotidien des conversations anonymes (tous les jours à 3h du matin)
SELECT cron.schedule(
  'cleanup-anonymous-conversations-daily',
  '0 3 * * *',
  $$
  SELECT public.cleanup_expired_anonymous_conversations();
  $$
);