import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from "@/hooks/useCookieConsent";
import CookiePreferencesModal from "./CookiePreferencesModal";

const CookieBanner = () => {
  const { showBanner, acceptCookies, declineCookies } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const { t, ready, i18n } = useTranslation();

  // Ne pas afficher le banner si i18n n'est pas prêt ou si les traductions ne sont pas chargées
  if (!showBanner || !ready || !i18n.isInitialized) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-2">
        <Card className="mx-auto max-w-4xl border border-border bg-background/95 backdrop-blur-sm shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <img src="/cuizly-icon-new.png" alt="Cuizly" className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {t('cookieBanner.title')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('cookieBanner.description')}{" "}
                <Link 
                  to="/cookies" 
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  {t('cookieBanner.learnMore')}
                </Link>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={declineCookies}
                className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 order-1 sm:order-none"
              >
                {t('cookieBanner.decline')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 order-3 sm:order-none"
              >
                <Settings className="h-3 w-3 mr-1" />
                {t('cookieBanner.configure')}
              </Button>
              <Button
                onClick={acceptCookies}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 bg-primary hover:bg-primary/90 order-2 sm:order-none"
              >
                {t('cookieBanner.accept')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <CookiePreferencesModal 
        open={showPreferences} 
        onOpenChange={setShowPreferences} 
      />
    </>
  );
};

export default CookieBanner;