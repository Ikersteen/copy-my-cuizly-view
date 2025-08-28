-- Corriger le conflit de politiques et maintenir la fonctionnalité
-- Supprimer la politique trop restrictive qui bloque tout
DROP POLICY IF EXISTS "Block all direct public access to restaurants table" ON public.restaurants;

-- Supprimer les politiques en double
DROP POLICY IF EXISTS "Authenticated restaurant owners can view own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their own restaurants only" ON public.restaurants;

-- Créer UNE politique claire pour les propriétaires seulement
CREATE POLICY "Restaurant owners access only" 
ON public.restaurants 
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- S'assurer qu'aucun accès public direct n'est possible à la table
-- Les données publiques doivent OBLIGATOIREMENT passer par get_public_restaurants()