import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import frTranslations from '@/locales/fr.json';
import enTranslations from '@/locales/en.json';

const resources = {
  fr: {
    translation: frTranslations
  },
  en: {
    translation: enTranslations
  }
};

// Initialize i18n with better persistence
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    // Remove hardcoded lng to let detection work
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      // Improved detection order for better persistence
      order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'sessionStorage'],
      lookupLocalStorage: 'cuizly-language',
      lookupSessionStorage: 'cuizly-language'
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },

    // Ensure translations are loaded synchronously
    initImmediate: false,
    preload: ['fr', 'en'],
    
    // Load missing translations immediately
    load: 'languageOnly',
    cleanCode: true
  });

export default i18n;