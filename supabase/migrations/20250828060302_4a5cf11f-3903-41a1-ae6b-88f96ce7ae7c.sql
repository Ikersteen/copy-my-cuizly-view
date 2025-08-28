-- Corriger les politiques RLS pour restaurant_analytics
-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "System functions can manage analytics" ON public.restaurant_analytics;

-- Créer des politiques plus permissives pour permettre les insertions/mises à jour
CREATE POLICY "Restaurant owners can manage analytics" 
ON public.restaurant_analytics 
FOR ALL 
TO authenticated
USING (restaurant_id IN (
  SELECT id FROM restaurants WHERE owner_id = auth.uid()
))
WITH CHECK (restaurant_id IN (
  SELECT id FROM restaurants WHERE owner_id = auth.uid()
));

-- Politique pour permettre aux fonctions automatiques d'insérer/mettre à jour
CREATE POLICY "Allow analytics operations" 
ON public.restaurant_analytics 
FOR ALL 
USING (true)
WITH CHECK (true);