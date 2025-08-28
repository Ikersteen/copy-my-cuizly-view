import { useState, useEffect } from 'react';

export const useCookieConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      setHasConsented(consent === 'true');
      setShowBanner(false);
    } else {
      setHasConsented(null);
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setHasConsented(true);
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'false');
    setHasConsented(false);
    setShowBanner(false);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookieConsent');
    setHasConsented(null);
    setShowBanner(true);
  };

  return {
    hasConsented,
    showBanner,
    acceptCookies,
    declineCookies,
    resetConsent
  };
};