import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollOnNavigation = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Attendre que le DOM soit complètement rendu
    const scrollToTop = () => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      });
    };

    // Délai court pour s'assurer que le contenu est rendu
    const timeoutId = setTimeout(scrollToTop, 50);

    return () => clearTimeout(timeoutId);
  }, [pathname]);
};