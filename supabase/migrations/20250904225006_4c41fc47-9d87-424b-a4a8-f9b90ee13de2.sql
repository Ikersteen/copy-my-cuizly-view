-- Nettoyer les données de menus: supprimer "vegan" des restrictions alimentaires et "peanuts" des allergènes
UPDATE menus 
SET 
  dietary_restrictions = array_remove(dietary_restrictions, 'vegan'),
  allergens = array_remove(allergens, 'peanuts'),
  updated_at = now()
WHERE 
  'vegan' = ANY(dietary_restrictions) 
  OR 'peanuts' = ANY(allergens);