import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '@/hooks/useLanguage';

/**
 * Component to handle language detection and redirect
 * Ensures all routes have /en/ or /fr/ prefix
 */
const LanguageRouter = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    
    // Check if path already has language prefix
    const hasLanguagePrefix = /^\/(en|fr)\//.test(path) || path === '/en' || path === '/fr';
    
    if (!hasLanguagePrefix && path !== '/') {
      // Path doesn't have language prefix, redirect with current language
      const currentLanguage = i18n.language as SupportedLanguage;
      const newPath = `/${currentLanguage}${path}`;
      navigate(newPath, { replace: true });
    } else if (path === '/') {
      // Root path, redirect to language-prefixed home
      const currentLanguage = i18n.language as SupportedLanguage;
      navigate(`/${currentLanguage}`, { replace: true });
    } else {
      // Extract language from URL and update i18n if needed
      const match = path.match(/^\/(en|fr)/);
      if (match) {
        const urlLanguage = match[1] as SupportedLanguage;
        if (urlLanguage !== i18n.language) {
          // Update i18n language to match URL
          i18n.changeLanguage(urlLanguage);
          localStorage.setItem('cuizly-language', urlLanguage);
        }
      }
    }
  }, [location.pathname, navigate, i18n]);

  return <>{children}</>;
};

export default LanguageRouter;
