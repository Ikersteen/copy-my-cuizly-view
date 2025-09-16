import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MapPin, Bell, Star, BarChart3, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeaturesSectionLanding = () => {
  const { t, ready } = useTranslation();
  
  // Si les traductions ne sont pas prêtes, on affiche un loader simple
  if (!ready) {
    return <div className="py-16 sm:py-20 bg-muted/30" />;
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
    <section id="features" className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-righteous text-foreground mb-3 sm:mb-4">
            {t('features.subtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="shadow-card border border-border">
                <CardHeader className="pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cuizly-surface rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cuizly-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {t(feature.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-cuizly-neutral text-sm sm:text-base">
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