import { LineChart, Users, Star, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TractionSection = () => {
  const metrics = [
    {
      icon: Users,
      title: "Utilisateurs actifs",
      value: "1,247",
      growth: "+340% (3 mois)",
      color: "text-cuizly-primary"
    },
    {
      icon: Star,
      title: "Restaurants partenaires",
      value: "89",
      growth: "+180% (3 mois)",  
      color: "text-cuizly-accent"
    },
    {
      icon: TrendingUp,
      title: "Recommandations/jour",
      value: "2,300+",
      growth: "+520% (3 mois)",
      color: "text-cuizly-secondary"
    },
    {
      icon: Calendar,
      title: "Réservations générées",
      value: "450",
      growth: "Ce mois-ci",
      color: "text-cuizly-primary"
    }
  ];

  const achievements = [
    "🚀 Croissance organique de 340% en 3 mois",
    "⭐ Score NPS de 72 (excellente satisfaction)",
    "🎯 97% de précision dans nos recommandations IA",
    "💰 ROI moyen de 3.2x pour les restaurants partenaires",
    "📱 50% d'utilisateurs actifs quotidiens",
    "🔄 Taux de rétention de 85% après 30 jours"
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary mb-4">
            <span className="text-cuizly-accent">Traction forte</span> en 3 mois
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral max-w-3xl mx-auto">
            Depuis notre lancement en beta, nos métriques démontrent un product-market fit évident 
            et une adoption rapide par les utilisateurs montréalais.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 sm:mb-12">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="border-cuizly-accent/20 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cuizly-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-cuizly-primary mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm font-semibold text-cuizly-secondary mb-2">
                    {metric.title}
                  </div>
                  <div className="text-xs text-cuizly-accent font-medium">
                    {metric.growth}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievements Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {achievements.map((achievement, index) => (
            <div 
              key={index}
              className="bg-white/5 border border-cuizly-accent/10 rounded-lg p-4 hover:border-cuizly-accent/20 transition-all duration-300"
            >
              <p className="text-sm text-cuizly-neutral">
                {achievement}
              </p>
            </div>
          ))}
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-r from-cuizly-primary/10 to-cuizly-accent/10 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-cuizly-primary mb-3">
            🎯 Product-Market Fit confirmé
          </h3>
          <p className="text-cuizly-neutral leading-relaxed max-w-4xl mx-auto">
            <strong className="text-cuizly-accent">40% de nos utilisateurs</strong> utilisent Cuizly plusieurs fois par semaine. 
            <strong className="text-cuizly-accent"> 78% des restaurants</strong> voient une augmentation measurable de clientèle en 30 jours.
            La demande est là, il faut maintenant scaler.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TractionSection;