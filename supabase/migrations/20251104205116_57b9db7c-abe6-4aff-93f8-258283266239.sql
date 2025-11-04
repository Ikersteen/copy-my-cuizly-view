-- Désactiver le nettoyage automatique des conversations anonymes
-- Les conversations restent en base de données pour l'amélioration continue de Cuizly
-- Mais disparaissent du frontend quand l'utilisateur recharge la page

-- Supprimer la tâche cron de nettoyage quotidien
SELECT cron.unschedule('cleanup-anonymous-conversations-daily');

-- Commentaire: Les conversations anonymes restent maintenant en base de données
-- de manière permanente pour permettre à Cuizly d'apprendre et de s'améliorer.
-- Seul le frontend ne les affiche plus après un rechargement de page grâce à sessionStorage.