import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export type SupportedLanguage = 'fr' | 'en';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as SupportedLanguage;

  const changeLanguage = useCallback((language: SupportedLanguage) => {
    // Save in both localStorage and sessionStorage for better persistence
    localStorage.setItem('cuizly-language', language);
    sessionStorage.setItem('cuizly-language', language);
    i18n.changeLanguage(language);
  }, [i18n]);

  const isLanguage = useCallback((language: SupportedLanguage) => {
    return currentLanguage === language;
  }, [currentLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    isLanguage,
    availableLanguages: ['en', 'fr'] as SupportedLanguage[]
  };
};