import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      type: "consumer",
      title: "Cuizly Basique",
      subtitle: "Pour les gourmets qui veulent découvrir Montréal",
      price: "Gratuit",
      popular: true,
      features: [
        "Accès à toutes les offres exclusives",
        "Recommandations IA personnalisées",
        "Alertes prioritaires sur les promos",
        "Réservations faciles en un clic",
        "Support client dédié",
        "Interface sans publicité"
      ],
      cta: "Commencer gratuitement"
    },
    {
      type: "pro",
      title: "Cuizly Pro",
      subtitle: "Pour restaurants qui veulent attirer plus de clients",
      price: "59$ CAD/mois",
      priceNote: "ou 499$ CAD/an (économisez 2 mois !)",
      comingSoon: true,
      features: [
        "Publicité ciblée de vos offres",
        "Promotion dans l'app selon localisation",
        "Ciblage par préférences utilisateur",
        "Dashboard de performance en temps réel",
        "Support prioritaire",
        "Formation à l'utilisation incluse"
      ],
      cta: "Essayer gratuitement"
    },
    {
      type: "analytics",
      title: "Cuizly Analytics+",
      subtitle: "Pour optimiser votre stratégie avec les données",
      price: "349$ CAD/mois",
      priceNote: "ou 3 490$ CAD/an (soit 2 mois gratuits !)",
      comingSoon: true,
      features: [
        "Toutes les fonctionnalités Pro",
        "Rapports anonymisés détaillés",
        "Analyses des tendances de consommation",
        "Insights sur les performances par segment",
        "Recommandations IA pour votre business",
        "Accès API pour intégrations avancées"
      ],
      cta: "Essayer gratuitement"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Des tarifs pensés pour tous
          </h2>
          <p className="text-lg text-cuizly-neutral max-w-3xl mx-auto">
            Une offre gratuite pour les gourmets, des solutions professionnelles abordables pour les restaurateurs. Commencez dès aujourd'hui !
          </p>
        </div>

        {/* Consumer Section */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">Pour les consommateurs</h3>
          <Card className="max-w-md bg-background/60 backdrop-blur-sm shadow-card border border-border/50 relative">
            <Badge className="absolute -top-3 left-6 bg-cuizly-accent text-white">
              Populaire
            </Badge>
            <div className="p-8">
              <h4 className="text-xl font-bold text-foreground mb-2">{plans[0].title}</h4>
              <p className="text-cuizly-neutral mb-4">{plans[0].subtitle}</p>
              <div className="text-3xl font-bold text-foreground mb-6">{plans[0].price}</div>
              
              <ul className="space-y-3 mb-8">
                {plans[0].features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-cuizly-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="w-full bg-cuizly-accent hover:bg-cuizly-accent/90 text-white">
                {plans[0].cta}
              </Button>
            </div>
          </Card>
        </div>

        {/* Restaurant Section */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6">Pour les restaurateurs</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {plans.slice(1).map((plan, index) => (
              <Card key={index} className="p-8 bg-background/60 backdrop-blur-sm shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 relative">
                {plan.comingSoon && (
                  <Badge className="absolute -top-3 left-6 bg-red-500 text-white">
                    Bientôt
                  </Badge>
                )}
                <h4 className="text-xl font-bold text-foreground mb-2">{plan.title}</h4>
                <p className="text-cuizly-neutral mb-4">{plan.subtitle}</p>
                
                <div className="mb-6">
                  <div className="text-3xl font-bold text-foreground">{plan.price}</div>
                  {plan.priceNote && (
                    <div className="text-sm text-cuizly-accent">{plan.priceNote}</div>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-cuizly-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full bg-cuizly-primary hover:bg-cuizly-primary/90 text-white">
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;