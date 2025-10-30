export const routeTranslations = {
  // English → French routes
  '/pricing': '/tarifs',
  '/features': '/fonctionnalites', 
  '/contact': '/contact',
  '/auth': '/connexion',
  '/team': '/equipe',
  '/legal': '/mentions-legales',
  '/privacy': '/politique-confidentialite',
  '/terms': '/conditions-utilisation',
  '/mentions': '/mentions-legales',
  '/cookies': '/politique-de-cookies',
  '/waitlist': '/liste-attente',
  '/cuizlyassistant': '/assistant-vocal',
  '/dashboard': '/tableau-de-bord',
  '/restaurant': '/restaurant',
  '/restaurant/reservations': '/restaurant/reservations',
  '/my-reservations': '/mes-reservations',
  '/email-confirmed': '/courriel-confirme'
} as const;

// French → English routes (reverse mapping)
export const reverseRouteTranslations = Object.fromEntries(
  Object.entries(routeTranslations).map(([en, fr]) => [fr, en])
) as Record<string, string>;

// Get route based on language
export const getLocalizedRoute = (route: string, language: 'fr' | 'en' = 'fr'): string => {
  if (language === 'fr') {
    return routeTranslations[route as keyof typeof routeTranslations] || route;
  }
  return route;
};

// Get English route from French route
export const getEnglishRoute = (frenchRoute: string): string => {
  return reverseRouteTranslations[frenchRoute] || frenchRoute;
};

// Hook to get localized route
import { useTranslation } from 'react-i18next';

export const useLocalizedRoute = (route: string): string => {
  const { i18n } = useTranslation();
  return getLocalizedRoute(route, i18n.language as 'fr' | 'en');
};