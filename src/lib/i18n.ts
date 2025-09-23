import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Define basic translations inline to avoid import issues
const resources = {
  fr: {
    translation: {
      "navigation": {
        "pricing": "Tarifs",
        "features": "Fonctionnalités", 
        "contact": "Contact",
        "dashboard": "Tableau de bord",
        "login": "Se connecter",
        "signup": "S'inscrire"
      },
      "common": {
        "loading": "Chargement...",
        "error": "Une erreur est survenue"
      }
    }
  },
  en: {
    translation: {
      "navigation": {
        "pricing": "Pricing",
        "features": "Features",
        "contact": "Contact", 
        "dashboard": "Dashboard",
        "login": "Login",
        "signup": "Sign Up"
      },
      "common": {
        "loading": "Loading...",
        "error": "An error occurred"
      }
    }
  }
};

// Initialize i18n 
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false
    },

    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator'],
      caches: ['localStorage', 'sessionStorage'],
      lookupLocalStorage: 'cuizly-language',
      lookupSessionStorage: 'cuizly-language',
    }
  });

// Load full translations after initialization
const loadFullTranslations = async () => {
  try {
    const [frRes, enRes] = await Promise.all([
      fetch('/locales/fr.json'),
      fetch('/locales/en.json')
    ]);
    
    const [frData, enData] = await Promise.all([
      frRes.json(),
      enRes.json()
    ]);

    i18n.addResourceBundle('fr', 'translation', frData, true, true);
    i18n.addResourceBundle('en', 'translation', enData, true, true);
  } catch (error) {
    console.warn('Could not load full translations:', error);
  }
};

// Load full translations asynchronously
loadFullTranslations();

export default i18n;