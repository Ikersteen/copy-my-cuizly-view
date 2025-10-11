import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { SupportedLanguage } from './useLanguage';

/**
 * Hook to navigate with language prefix
 * Ensures all navigation includes /en/ or /fr/ prefix
 */
export const useLanguageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as SupportedLanguage;

  /**
   * Navigate to a path with the current language prefix
   */
  const navigateWithLanguage = useCallback((path: string, options?: any) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Add language prefix
    const pathWithLanguage = `/${currentLanguage}/${cleanPath}`;
    
    navigate(pathWithLanguage, options);
  }, [navigate, currentLanguage]);

  /**
   * Get current path without language prefix
   */
  const getPathWithoutLanguage = useCallback(() => {
    const path = location.pathname;
    // Remove /en/ or /fr/ prefix
    return path.replace(/^\/(en|fr)\//, '/');
  }, [location.pathname]);

  /**
   * Get full path with language prefix
   */
  const getPathWithLanguage = useCallback((path: string, lang?: SupportedLanguage) => {
    const language = lang || currentLanguage;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${language}/${cleanPath}`;
  }, [currentLanguage]);

  return {
    navigateWithLanguage,
    getPathWithoutLanguage,
    getPathWithLanguage,
    currentLanguage
  };
};
