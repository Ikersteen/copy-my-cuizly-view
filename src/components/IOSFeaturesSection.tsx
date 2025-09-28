import { useTranslation } from "react-i18next";
import { Search, MapPin, Star, Zap, Shield, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const IOSFeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Search,
      title: t('features.smartSearch.title'),
      description: t('features.smartSearch.description'),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: MapPin,
      title: t('features.geoLocation.title'),
      description: t('features.geoLocation.description'),
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Star,
      title: t('features.reviews.title'),
      description: t('features.reviews.description'),
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Zap,
      title: t('features.realTime.title'),
      description: t('features.realTime.description'),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Heart,
      title: t('features.favorites.title'),
      description: t('features.favorites.description'),
      gradient: "from-rose-500 to-pink-500"
    }
  ];

  return (
    <section id="features" className="py-20 px-4 bg-gradient-to-b from-background to-accent/5">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group bg-card/50 backdrop-blur-sm border-border/50 rounded-3xl overflow-hidden hover:bg-card/80 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <CardContent className="p-6 text-center">
                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>{t('features.moreComing')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IOSFeaturesSection;