-- Mettre à jour l'adresse dans la table restaurants
UPDATE restaurants 
SET address = '1871 Rue Sainte-Catherine Ouest, Montréal, QC, Canada'
WHERE address ILIKE '%montreal%' 
AND address NOT ILIKE '%rue%'
AND address NOT ILIKE '%avenue%';