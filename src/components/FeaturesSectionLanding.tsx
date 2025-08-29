import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MapPin, Bell, Star, BarChart3, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeaturesSectionLanding = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: Bot,
      title: t('features.ai_recommendations.title'),
      description: t('features.ai_recommendations.description')
    },
    {
      icon: MapPin,
      title: t('features.geolocation.title'),
      description: t('features.geolocation.description')
    },
    {
      icon: Bell,
      title: t('features.real_time_alerts.title'),
      description: t('features.real_time_alerts.description')
    },
    {
      icon: Star,
      title: t('features.reviews_ratings.title'),
      description: t('features.reviews_ratings.description')
    },
    {
      icon: BarChart3,
      title: t('features.restaurant_analytics.title'),
      description: t('features.restaurant_analytics.description')
    },
    {
      icon: Users,
      title: t('features.smart_targeting.title'),
      description: t('features.smart_targeting.description')
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg sm:text-xl text-cuizly-neutral max-w-3xl mx-auto px-2 sm:px-4">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="shadow-card border border-border">
                <CardHeader className="pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cuizly-surface rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cuizly-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-cuizly-neutral text-sm sm:text-base">
                    {feature.description}
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