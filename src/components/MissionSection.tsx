import { Card } from "@/components/ui/card";
import { Target, Eye, Users, TrendingUp } from "lucide-react";

const MissionSection = () => {
  const features = [
    {
      icon: Target,
      title: "Notre Mission",
      description: "Connecter les gens aux meilleures offres culinaires à Montréal, tout en aidant les restaurants à attirer plus de clients.",
      color: "text-cuizly-accent"
    },
    {
      icon: Eye,
      title: "Notre Vision",
      description: "Devenir l'app incontournable au Canada pour découvrir facilement où bien manger, au bon prix, grâce à l'IA.",
      color: "text-cuizly-primary"
    },
    {
      icon: Users,
      title: "Pour les Gourmets",
      description: "Trouvez facilement les meilleures promos au bon moment avec des recommandations personnalisées adaptées à vos goûts.",
      color: "text-cuizly-accent"
    },
    {
      icon: TrendingUp,
      title: "Pour les Restaurants",
      description: "Attirez plus de clients, gérez vos promos facilement et remplissez vos tables même aux heures calmes.",
      color: "text-cuizly-primary"
    }
  ];

  return (
    <section className="py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-cuizly-primary mb-4">
            Cuizly Technologie Inc.
          </h2>
          <p className="text-lg text-cuizly-primary-light max-w-3xl mx-auto">
            Plateforme foodtech basée à Montréal, développée par <strong>Iker Kiomba Landu</strong>, 
            Président Directeur Général et Fondateur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-8 bg-background shadow-card hover:shadow-elevated transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-card ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-cuizly-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-cuizly-accent/10 backdrop-blur-sm rounded-full px-6 py-3">
            <span className="text-lg">🇨🇦</span>
            <span className="text-sm font-medium text-cuizly-primary">Secteur d'opération</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-cuizly-accent font-medium">Montréal, Québec</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;