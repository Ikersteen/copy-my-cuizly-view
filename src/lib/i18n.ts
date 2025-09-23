import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import frTranslations from '@/locales/fr.json';

const resources = {
  fr: {
    translation: frTranslations
  }
};

// Initialize i18n for French only
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // Force French
    fallbackLng: 'fr',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },

    // Ensure translations are loaded synchronously
    initImmediate: false,
    preload: ['fr'],
    
    // Load missing translations immediately
    load: 'languageOnly',
    cleanCode: true
  });

export default i18n;