-- Supprimer les restrictions alimentaires et allergènes non désirées du restaurant
UPDATE restaurants 
SET 
  dietary_restrictions = '{}',
  allergens = '{}'
WHERE is_active = true;