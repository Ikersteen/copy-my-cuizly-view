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

// Initialize i18n immediately
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    lng: 'fr',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cuizly-language'
    },

    react: {
      useSuspense: false,
    }
  });

// Force French language
i18n.changeLanguage('fr');

export default i18n;