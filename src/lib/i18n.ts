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

// Initialize i18n with both French and English support
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('cuizly-language') || 'fr', // Default to French
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

    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator'],
      caches: ['localStorage', 'sessionStorage']
    },

    // Ensure translations are loaded synchronously
    initImmediate: false,
    preload: ['fr', 'en'],
    
    // Load missing translations immediately
    load: 'languageOnly',
    cleanCode: true
  });

export default i18n;