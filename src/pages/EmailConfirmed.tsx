import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailConfirmed = () => {
  const [countdown, setCountdown] = useState(3);
  const { t } = useTranslation();

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload(); // Recharge la page au lieu de naviguer
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirectNow = () => {
    window.location.reload(); // Recharge la page au lieu de naviguer
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in shadow-2xl border-0 bg-card/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-fade-in">
            <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground animate-fade-in">
              {t('emailConfirmed.title')}
            </CardTitle>
            <CardDescription className="text-lg animate-fade-in">
              {t('emailConfirmed.description')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 animate-fade-in">
            <p className="text-green-800 font-medium">
              {t('emailConfirmed.successMessage')}
            </p>
          </div>

          <div className="space-y-3 animate-fade-in">
            <p className="text-muted-foreground">
              {t('emailConfirmed.redirectMessage', { seconds: countdown })}
            </p>
            
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-linear animate-pulse"
                style={{ width: `${(3 - countdown) * 33.33}%` }}
              />
            </div>
          </div>

          <Button 
            onClick={handleRedirectNow}
            className="w-full group hover-scale transition-all duration-300"
            size="lg"
          >
            <span>{t('emailConfirmed.accessNow')}</span>
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-xs text-muted-foreground">
            {t('emailConfirmed.welcomeMessage')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmed;