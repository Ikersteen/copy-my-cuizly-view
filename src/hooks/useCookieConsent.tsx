import { useState, useEffect } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentData {
  preferences: CookiePreferences;
  timestamp: number;
}

const CONSENT_EXPIRY_MONTHS = 6;

export const useCookieConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consentData = localStorage.getItem('cookieConsentData');
    
    if (consentData) {
      try {
        const parsed: CookieConsentData = JSON.parse(consentData);
        const now = new Date().getTime();
        const sixMonthsInMs = CONSENT_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000;
        
        // Check if consent has expired
        if (now - parsed.timestamp > sixMonthsInMs) {
          localStorage.removeItem('cookieConsentData');
          setHasConsented(null);
          // Don't show banner until user interacts
        } else {
          const hasAnyConsent = parsed.preferences.analytics || parsed.preferences.marketing;
          setHasConsented(hasAnyConsent);
          setPreferences(parsed.preferences);
          setShowBanner(false);
        }
      } catch {
        // Invalid data, reset
        localStorage.removeItem('cookieConsentData');
        setHasConsented(null);
        // Don't show banner until user interacts
      }
    } else {
      setHasConsented(null);
      // Don't show banner until user interacts
    }
  }, []);

  // Removed automatic user interaction detection
  // Banner will only show when manually triggered

  const saveConsentData = (prefs: CookiePreferences) => {
    const consentData: CookieConsentData = {
      preferences: prefs,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('cookieConsentData', JSON.stringify(consentData));
  };

  const acceptCookies = () => {
    const newPrefs = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    saveConsentData(newPrefs);
    setPreferences(newPrefs);
    setHasConsented(true);
    setShowBanner(false);
  };

  const declineCookies = () => {
    const newPrefs = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    saveConsentData(newPrefs);
    setPreferences(newPrefs);
    setHasConsented(false);
    setShowBanner(false);
  };

  const saveCustomPreferences = (customPrefs: CookiePreferences) => {
    saveConsentData(customPrefs);
    setPreferences(customPrefs);
    const hasAnyConsent = customPrefs.analytics || customPrefs.marketing;
    setHasConsented(hasAnyConsent);
    setShowBanner(false);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookieConsentData');
    setHasConsented(null);
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false
    });
    // Don't automatically show banner on reset
  };

  // Manual function to show banner when needed
  const showConsentBanner = () => {
    setShowBanner(true);
  };

  return {
    hasConsented,
    showBanner,
    preferences,
    acceptCookies,
    declineCookies,
    saveCustomPreferences,
    resetConsent,
    showConsentBanner
  };
};