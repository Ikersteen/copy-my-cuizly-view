import { TrendingUp, Users, Building2, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const MarketOpportunitySection = () => {
  const marketData = [
    {
      icon: TrendingUp,
      title: "Marché en croissance",
      value: "$680B",
      description: "Marché mondial de la food-tech en 2024",
      growth: "+12% annuel"
    },
    {
      icon: Users,
      title: "Montréal Metro",
      value: "4.3M",
      description: "Habitants dans la région métropolitaine",
      growth: "2 000+ restaurants"
    },
    {
      icon: Building2,
      title: "Problème restaurant",
      value: "70%",
      description: "Peinent à attirer de nouveaux clients",
      growth: "Coût acquisition élevé"
    },
    {
      icon: DollarSign,
      title: "TAM Montréal",
      value: "$2.1B",
      description: "Marché restauration annuel",
      growth: "Notre cible: 3%"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary mb-4">
            Un marché de <span className="text-cuizly-accent">$680 milliards</span>
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral max-w-3xl mx-auto">
            La food-tech explose, mais la découverte culinaire reste un problème majeur 
            pour 85% des consommateurs et 70% des restaurants.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketData.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="border-cuizly-accent/20 bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cuizly-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-cuizly-accent" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-cuizly-primary mb-1">
                    {item.value}
                  </div>
                  <div className="text-sm font-semibold text-cuizly-secondary mb-2">
                    {item.title}
                  </div>
                  <p className="text-xs text-cuizly-neutral mb-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-xs text-cuizly-accent font-medium">
                    {item.growth}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-cuizly-primary mb-3">
            Pourquoi maintenant ?
          </h3>
          <p className="text-cuizly-neutral leading-relaxed max-w-4xl mx-auto">
            L'IA générative rend possible une personnalisation à grande échelle. Les consommateurs 
            veulent des expériences sur-mesure. Les restaurants cherchent des solutions efficaces 
            pour acquérir des clients. <span className="font-semibold text-cuizly-accent">C'est le moment parfait.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketOpportunitySection;