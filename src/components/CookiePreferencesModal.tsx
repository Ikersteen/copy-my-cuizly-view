import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Shield, BarChart3, Target } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

interface CookiePreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CookiePreferencesModal = ({ open, onOpenChange }: CookiePreferencesModalProps) => {
  const { preferences, saveCustomPreferences } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = () => {
    saveCustomPreferences(localPreferences);
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    setLocalPreferences(allAccepted);
    saveCustomPreferences(allAccepted);
    onOpenChange(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    setLocalPreferences(onlyNecessary);
    saveCustomPreferences(onlyNecessary);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            Préférences des cookies
          </DialogTitle>
          <DialogDescription>
            Gérez vos préférences de cookies. Ces paramètres seront conservés pendant 6 mois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cookies nécessaires */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-green-600" />
                Cookies nécessaires
              </CardTitle>
              <CardDescription>
                Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="necessary" className="text-sm font-medium">
                  Cookies techniques
                </Label>
                <Switch
                  id="necessary"
                  checked={true}
                  disabled={true}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cookies analytiques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Cookies analytiques
              </CardTitle>
              <CardDescription>
                Ces cookies nous aident à comprendre comment vous utilisez notre site pour l'améliorer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics" className="text-sm font-medium">
                  Analyses et statistiques
                </Label>
                <Switch
                  id="analytics"
                  checked={localPreferences.analytics}
                  onCheckedChange={(checked) => 
                    setLocalPreferences(prev => ({ ...prev, analytics: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Cookies marketing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-purple-600" />
                Cookies marketing
              </CardTitle>
              <CardDescription>
                Ces cookies sont utilisés pour vous proposer des publicités personnalisées et pertinentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing" className="text-sm font-medium">
                  Publicité personnalisée
                </Label>
                <Switch
                  id="marketing"
                  checked={localPreferences.marketing}
                  onCheckedChange={(checked) => 
                    setLocalPreferences(prev => ({ ...prev, marketing: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleRejectAll}
            className="w-full sm:w-auto"
          >
            Refuser tout
          </Button>
          <Button
            variant="outline"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto"
          >
            Accepter tout
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Enregistrer mes choix
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;