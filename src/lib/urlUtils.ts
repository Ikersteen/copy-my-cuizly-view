import { useTranslation } from 'react-i18next';

// Fonction pour nettoyer et formater un slug
export const createSlug = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
    .replace(/^-|-$/g, ''); // Supprimer les tirets en début et fin
};

// Fonction pour générer l'URL personnalisée d'un utilisateur
export const generateUserUrl = (
  userType: 'consumer' | 'restaurant_owner',
  profile: any,
  restaurant: any = null,
  language: string = 'fr'
): string => {
  const basePath = language === 'fr' ? '/tableau-de-bord' : '/dashboard';
  
  if (userType === 'restaurant_owner' && restaurant?.name) {
    const slug = createSlug(restaurant.name);
    return `${basePath}/${slug}`;
  } else if (userType === 'consumer') {
    if (profile?.username) {
      const slug = createSlug(profile.username);
      return `${basePath}/${slug}`;
    } else if (profile?.first_name && profile?.last_name) {
      const fullName = `${profile.first_name} ${profile.last_name}`;
      const slug = createSlug(fullName);
      return `${basePath}/${slug}`;
    } else if (profile?.first_name) {
      const slug = createSlug(profile.first_name);
      return `${basePath}/${slug}`;
    }
  }
  
  // Fallback vers l'URL générique
  return basePath;
};

// Fonction pour extraire et valider un slug depuis l'URL
export const extractSlugFromUrl = (pathname: string): string | null => {
  const match = pathname.match(/\/(tableau-de-bord|dashboard)\/([^\/]+)/);
  return match ? match[2] : null;
};

// Hook pour générer l'URL personnalisée de l'utilisateur actuel
export const usePersonalizedUrl = (
  userType: 'consumer' | 'restaurant_owner' | null,
  profile: any,
  restaurant: any = null
) => {
  const { i18n } = useTranslation();
  
  if (!userType || !profile) return null;
  
  return generateUserUrl(userType, profile, restaurant, i18n.language);
};