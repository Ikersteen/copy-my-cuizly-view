import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useLanguageNavigation } from "@/hooks/useLanguageNavigation";

const EmailConfirmed = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { navigateWithLanguage } = useLanguageNavigation();

  useEffect(() => {
    // Redirection automatique vers le dashboard après 5 secondes
    const timer = setTimeout(() => {
      navigateWithLanguage('dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigateWithLanguage]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in shadow-2xl border-0 bg-card/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-fade-in">
            <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-foreground animate-fade-in">
            Bienvenue dans Cuizly
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 animate-fade-in">
            <p className="text-green-800 font-medium">
              {t('emailConfirmed.successMessage')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmed;