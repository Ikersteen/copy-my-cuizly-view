import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

const CookieSettings = () => {
  const { hasConsented, resetConsent } = useCookieConsent();

  // Don't show the button if user hasn't made a choice yet (banner is showing)
  if (hasConsented === null) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Button
        variant="outline"
        size="sm"
        onClick={resetConsent}
        className="h-9 px-3 bg-background/95 backdrop-blur-sm border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      >
        <Cookie className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-xs font-medium">Cookies</span>
      </Button>
    </div>
  );
};

export default CookieSettings;