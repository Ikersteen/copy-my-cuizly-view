-- Ajouter des colonnes de traduction pour les descriptions de restaurants
ALTER TABLE public.restaurants 
ADD COLUMN description_fr text,
ADD COLUMN description_en text;

-- Migrer les descriptions existantes vers la colonne française par défaut
UPDATE public.restaurants 
SET description_fr = description 
WHERE description IS NOT NULL;

-- Ajouter des traductions par défaut pour les descriptions existantes
UPDATE public.restaurants 
SET description_en = CASE 
  WHEN description_fr LIKE '%🌍✨ World-Inspired Cuisine ✨🌍%' THEN '🌍✨ World-Inspired Cuisine ✨🌍
✈️ A culinary journey without borders.
🍜 Asian flavors, 🌶️ Oriental spices, 🥗 Mediterranean freshness, and 🍔 American indulgence.
🍷 Each dish is a stopover, a meeting, an invitation to taste the world… one bite at a time. 🥢🍴'
  WHEN description_fr IS NOT NULL THEN description_fr
  ELSE NULL
END
WHERE description_en IS NULL;

-- Créer une fonction pour obtenir la description traduite
CREATE OR REPLACE FUNCTION public.get_translated_description(restaurant_row restaurants, language text DEFAULT 'fr')
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE language
    WHEN 'en' THEN
      RETURN COALESCE(restaurant_row.description_en, restaurant_row.description_fr, restaurant_row.description);
    ELSE
      RETURN COALESCE(restaurant_row.description_fr, restaurant_row.description);
  END CASE;
END;
$$;