import { useTranslation } from 'react-i18next';

export const routeTranslations = {
  // English → French routes (without language prefix)
  'pricing': 'tarifs',
  'features': 'fonctionnalites', 
  'contact': 'contact',
  'auth': 'connexion',
  'team': 'equipe',
  'legal': 'mentions-legales',
  'privacy': 'politique-confidentialite',
  'terms': 'conditions-utilisation',
  'mentions': 'mentions-legales',
  'cookies': 'politique-de-cookies',
  'waitlist': 'liste-attente',
  'voice': 'assistant-vocal',
  'dashboard': 'tableau-de-bord',
  'restaurant': 'restaurant',
  'restaurant/reservations': 'restaurant/reservations',
  'my-reservations': 'mes-reservations',
  'email-confirmed': 'courriel-confirme'
} as const;

// French → English routes (reverse mapping)
export const reverseRouteTranslations = Object.fromEntries(
  Object.entries(routeTranslations).map(([en, fr]) => [fr, en])
) as Record<string, string>;

/**
 * Get route with language prefix
 * @param route - Route without language prefix (e.g., 'pricing' or 'tarifs')
 * @param language - Target language ('en' or 'fr')
 * @returns Full route with language prefix (e.g., '/en/pricing' or '/fr/tarifs')
 */
export const getLocalizedRoute = (route: string, language: 'fr' | 'en' = 'en'): string => {
  // Remove leading slash if present
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  
  // Remove language prefix if present
  const routeWithoutLang = cleanRoute.replace(/^(en|fr)\//, '');
  
  if (language === 'fr') {
    // Translate to French if needed
    const frenchRoute = routeTranslations[routeWithoutLang as keyof typeof routeTranslations] || routeWithoutLang;
    return `/${language}/${frenchRoute}`;
  }
  
  // For English, check if it's a French route that needs translation
  const englishRoute = reverseRouteTranslations[routeWithoutLang] || routeWithoutLang;
  return `/${language}/${englishRoute}`;
};

/**
 * Get English route from French route
 */
export const getEnglishRoute = (frenchRoute: string): string => {
  const cleanRoute = frenchRoute.replace(/^\/?(fr\/)?/, '');
  return reverseRouteTranslations[cleanRoute] || cleanRoute;
};

/**
 * Hook to get localized route with language prefix
 */
export const useLocalizedRoute = (route: string): string => {
  const { i18n } = useTranslation();
  return getLocalizedRoute(route, i18n.language as 'fr' | 'en');
};