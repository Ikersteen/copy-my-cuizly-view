import { DollarSign, Percent, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const BusinessModelSection = () => {
  const revenueStreams = [
    {
      icon: Percent,
      title: "Commission par réservation",
      description: "3-5% par réservation générée via Cuizly",
      revenue: "$2-8 par réservation",
      color: "text-cuizly-primary"
    },
    {
      icon: DollarSign,
      title: "Abonnements restaurants",
      description: "Plans Premium pour plus de visibilité",
      revenue: "$99-299/mois par restaurant",
      color: "text-cuizly-accent"
    },
    {
      icon: TrendingUp,
      title: "Publicité ciblée",
      description: "Promotion payante dans les recommandations IA",
      revenue: "$0.50-2 par clic qualifié",
      color: "text-cuizly-secondary"
    },
    {
      icon: Users,
      title: "Données & Analytics",
      description: "Insights consommateurs pour les restaurants",
      revenue: "$49-199/mois par restaurant",
      color: "text-cuizly-primary"
    }
  ];

  const projections = [
    { year: "2024", restaurants: 250, users: 5000, revenue: "$180K" },
    { year: "2025", restaurants: 800, users: 25000, revenue: "$1.2M" },
    { year: "2026", restaurants: 2500, users: 80000, revenue: "$4.5M" },
    { year: "2027", restaurants: 5000, users: 200000, revenue: "$12M" }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary mb-4">
            Modèle économique <span className="text-cuizly-accent">diversifié</span>
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral max-w-3xl mx-auto">
            Quatre sources de revenus complémentaires qui génèrent de la valeur 
            pour tous les acteurs de l'écosystème.
          </p>
        </div>

        {/* Revenue Streams */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {revenueStreams.map((stream, index) => {
            const Icon = stream.icon;
            return (
              <Card key={index} className="border-cuizly-accent/20 bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-cuizly-light/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-6 w-6 ${stream.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-cuizly-primary mb-2">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-cuizly-neutral mb-3 leading-relaxed">
                        {stream.description}
                      </p>
                      <div className="text-sm font-bold text-cuizly-accent">
                        {stream.revenue}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Projections */}
        <div className="bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8 mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-cuizly-primary mb-6 text-center">
            Projections de croissance
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projections.map((proj, index) => (
              <div key={index} className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-cuizly-accent mb-2">
                  {proj.year}
                </div>
                <div className="space-y-1 text-xs text-cuizly-neutral">
                  <div>{proj.restaurants} restaurants</div>
                  <div>{proj.users} utilisateurs</div>
                  <div className="font-semibold text-cuizly-primary text-sm">
                    {proj.revenue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Economics */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-cuizly-accent/20 rounded-xl p-6">
            <h4 className="text-lg font-bold text-cuizly-primary mb-4">
              💰 Unit Economics
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cuizly-neutral">CAC (Customer Acquisition Cost)</span>
                <span className="font-semibold text-cuizly-primary">$15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cuizly-neutral">LTV (Lifetime Value)</span>
                <span className="font-semibold text-cuizly-primary">$180</span>
              </div>
              <div className="flex justify-between border-t border-cuizly-accent/20 pt-2">
                <span className="text-cuizly-accent font-semibold">Ratio LTV/CAC</span>
                <span className="font-bold text-cuizly-accent">12:1</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-cuizly-accent/20 rounded-xl p-6">
            <h4 className="text-lg font-bold text-cuizly-primary mb-4">
              📈 Métriques clés
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cuizly-neutral">Marge brute</span>
                <span className="font-semibold text-cuizly-primary">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cuizly-neutral">Payback period</span>
                <span className="font-semibold text-cuizly-primary">2.3 mois</span>
              </div>
              <div className="flex justify-between border-t border-cuizly-accent/20 pt-2">
                <span className="text-cuizly-accent font-semibold">ROI restaurants</span>
                <span className="font-bold text-cuizly-accent">320%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessModelSection;