import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MapPin, Bell, Star, BarChart3, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeaturesSectionLanding = () => {
  const { t, ready } = useTranslation();
  
  // Si les traductions ne sont pas prêtes, on affiche un loader simple
  if (!ready) {
    return <div className="py-12 sm:py-16 lg:py-20 bg-muted/30" />;
  }
  
  const features = [
    {
      icon: Bot,
      titleKey: 'features.list.ai.title',
      descriptionKey: 'features.list.ai.description'
    },
    {
      icon: MapPin,
      titleKey: 'features.list.geolocation.title',
      descriptionKey: 'features.list.geolocation.description'
    },
    {
      icon: Bell,
      titleKey: 'features.list.alerts.title',
      descriptionKey: 'features.list.alerts.description'
    },
    {
      icon: Star,
      titleKey: 'features.list.reviews.title',
      descriptionKey: 'features.list.reviews.description'
    },
    {
      icon: BarChart3,
      titleKey: 'features.list.analytics.title',
      descriptionKey: 'features.list.analytics.description'
    },
    {
      icon: Users,
      titleKey: 'features.list.targeting.title',
      descriptionKey: 'features.list.targeting.description'
    }
  ];

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 mobile-friendly-spacing">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            {t('features.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-cuizly-neutral max-w-3xl mx-auto px-4 sm:px-6">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mobile-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="shadow-card border border-border mobile-card-spacing touch-spacing">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cuizly-surface rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto sm:mx-0">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cuizly-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-foreground text-center sm:text-left">
                    {t(feature.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-cuizly-neutral text-sm sm:text-base text-center sm:text-left leading-relaxed">
                    {t(feature.descriptionKey)}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSectionLanding;