import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MapPin, Bell, Star, BarChart3, Users } from "lucide-react";

const FeaturesSectionLanding = () => {
  const features = [
    {
      icon: Bot,
      title: "Intelligence Artificielle",
      description: "Recommandations personnalisées basées sur vos goûts et préférences culinaires."
    },
    {
      icon: MapPin,
      title: "Géolocalisation",
      description: "Trouvez les meilleures offres près de chez vous à Montréal."
    },
    {
      icon: Bell,
      title: "Alertes en temps réel",
      description: "Soyez informé instantanément des nouvelles offres qui vous intéressent."
    },
    {
      icon: Star,
      title: "Avis et notations",
      description: "Consultez les avis authentiques des autres utilisateurs."
    },
    {
      icon: BarChart3,
      title: "Analytics pour restaurants",
      description: "Analysez les performances de vos offres avec des données détaillées."
    },
    {
      icon: Users,
      title: "Ciblage intelligent",
      description: "Atteignez la bonne clientèle au bon moment avec notre IA."
    }
  ];

  return (
    <section id="features" className="py-20 sm:py-32 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-background to-muted/30 border border-border/50 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Fonctionnalités
            </h2>
            <p className="text-xl sm:text-2xl text-foreground/70 max-w-4xl mx-auto leading-relaxed">
              Découvrez toutes les fonctionnalités qui font de Cuizly la plateforme de référence pour les offres culinaires à Montréal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                  <CardHeader className="pb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-foreground/70 text-base sm:text-lg leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSectionLanding;