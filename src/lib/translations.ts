// Utility functions for translating restaurant content

interface Restaurant {
  description?: string;
  description_fr?: string;
  description_en?: string;
}

/**
 * Get translated description based on language
 */
export const getTranslatedDescription = (restaurant: Restaurant, language: string): string => {
  if (language === 'en') {
    return restaurant.description_en || restaurant.description_fr || restaurant.description || "";
  }
  return restaurant.description_fr || restaurant.description || "";
};