import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MapPin, Bell, Star, BarChart3, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
        
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Fonctionnalités
          </h1>
          <p className="text-lg sm:text-xl text-cuizly-neutral max-w-3xl mx-auto px-2 sm:px-4">
            Découvrez toutes les fonctionnalités qui font de Cuizly la plateforme de référence pour les offres culinaires à Montréal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="shadow-card border border-border">
                <CardHeader className="pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cuizly-surface rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
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
      <Footer />
    </div>
  );
};

export default Features;