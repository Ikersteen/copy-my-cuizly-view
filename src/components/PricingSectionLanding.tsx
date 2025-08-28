import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const PricingSectionLanding = () => {
  const plans = [
    {
      title: "Cuizly Basique",
      subtitle: "Pour les consommateurs",
      price: "Gratuit à vie",
      popular: true,
      features: [
        "Accès à toutes les offres exclusives",
        "Recommandations IA personnalisées",
        "Alertes prioritaires sur les promos",
        "Tableau de bord intuitif et fluide",
        "Support client dédié"
      ],
      cta: "Commencer gratuitement"
    },
    {
      title: "Cuizly Pro",
      subtitle: "Pour les restaurants",
      price: "59$ CAD/mois",
      priceNote: "ou 499$ CAD/an (économisez 2 mois !)",
      comingSoon: true,
      features: [
        "Publicité ciblée de vos offres",
        "Promotion dans l'app selon localisation",
        "Ciblage par préférences utilisateur",
        "Tableau de performance en temps réel",
        "Support prioritaire"
      ],
      cta: "Essayer gratuitement"
    },
    {
      title: "Cuizly Analytics+",
      subtitle: "Pour optimiser avec les données des restaurants",
      price: "349$ CAD/mois",
      priceNote: "ou 3 490$ CAD/an (soit 2 mois gratuits !)",
      comingSoon: true,
      features: [
        "Toutes les fonctionnalités Pro",
        "Rapports anonymisés détaillés",
        "Analyses des tendances de consommation",
        "Aperçus sur les performances par segment",
        "Recommandations IA pour votre business"
      ],
      cta: "Essayer gratuitement"
    }
  ];

  return (
    <section id="pricing" className="py-16 sm:py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Des tarifs pensés pour tous
          </h2>
          <p className="text-lg sm:text-xl text-cuizly-neutral max-w-3xl mx-auto px-2 sm:px-4">
            Une offre gratuite pour les consommateurs, des solutions professionnelles abordables pour les restaurateurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative shadow-card border border-border ${plan.popular ? 'ring-2 ring-foreground' : ''} ${index < 2 ? 'h-fit' : ''} ${index === 2 ? 'md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background">
                  Populaire
                </Badge>
              )}
              {plan.comingSoon && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground animate-none pointer-events-none">
                  Bientôt
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-foreground">{plan.title}</CardTitle>
                <p className="text-cuizly-neutral text-sm sm:text-base">{plan.subtitle}</p>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mt-3 sm:mt-4">{plan.price}</div>
                {plan.priceNote && (
                  <p className="text-xs sm:text-sm text-cuizly-neutral">{plan.priceNote}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 sm:space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-2 sm:space-x-3">
                      <Check className="h-4 w-4 text-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                {(index === 1 || index === 2) ? (
                  <Button className="w-full bg-foreground hover:bg-foreground/90 text-background text-sm sm:text-base" disabled>
                    <span className="line-through">{plan.cta}</span>
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full bg-foreground hover:bg-foreground/90 text-background text-sm sm:text-base">
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSectionLanding;