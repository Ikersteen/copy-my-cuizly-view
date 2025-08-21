import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MapPin, Bell, Star, BarChart3, Users } from "lucide-react";

const Features = () => {
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Fonctionnalités
          </h1>
          <p className="text-xl text-cuizly-neutral max-w-3xl mx-auto">
            Découvrez toutes les fonctionnalités qui font de Cuizly la plateforme de référence pour les offres culinaires à Montréal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="shadow-card border border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-cuizly-surface rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-cuizly-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-cuizly-neutral">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Features;