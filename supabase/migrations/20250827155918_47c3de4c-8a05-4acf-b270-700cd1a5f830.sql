-- Supprimer toutes les évaluations de la table ratings
DELETE FROM public.ratings;

-- Supprimer toutes les évaluations des commentaires (mettre rating à NULL)
UPDATE public.comments 
SET rating = NULL 
WHERE rating IS NOT NULL;

-- Réinitialiser les données analytiques des restaurants
UPDATE public.restaurant_analytics 
SET 
  rating_count = 0,
  average_rating = 0
WHERE rating_count > 0 OR average_rating > 0;