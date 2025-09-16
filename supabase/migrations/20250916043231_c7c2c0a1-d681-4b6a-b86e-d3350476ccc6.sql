-- Mettre à jour l'adresse du restaurant
UPDATE addresses 
SET formatted_address = '1871 Rue Sainte-Catherine Ouest, Montréal, QC, Canada'
WHERE type = 'restaurant' 
AND formatted_address ILIKE '%montreal%' 
AND formatted_address NOT ILIKE '%rue%';