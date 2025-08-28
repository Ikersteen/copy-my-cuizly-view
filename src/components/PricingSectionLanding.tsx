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
    <section id="pricing" className="py-20 sm:py-32 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-background to-muted/30 border border-border/50 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Des tarifs pensés pour tous
            </h2>
            <p className="text-xl sm:text-2xl text-foreground/70 max-w-4xl mx-auto leading-relaxed">
              Une offre gratuite pour les consommateurs, des solutions professionnelles abordables pour les restaurateurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 items-start">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl ${plan.popular ? 'ring-2 ring-primary scale-105' : ''} ${index < 2 ? 'h-fit' : ''} ${index === 2 ? 'md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground shadow-lg">
                    Populaire
                  </Badge>
                )}
                {plan.comingSoon && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground shadow-lg">
                    Bientôt
                  </Badge>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">{plan.title}</CardTitle>
                  <p className="text-foreground/70 text-base sm:text-lg">{plan.subtitle}</p>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground mt-4 sm:mt-6">{plan.price}</div>
                  {plan.priceNote && (
                    <p className="text-sm sm:text-base text-foreground/60">{plan.priceNote}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 sm:space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {(index === 1 || index === 2) ? (
                    <Button className="w-full bg-foreground/50 hover:bg-foreground/60 text-background text-base sm:text-lg py-3 rounded-xl" disabled>
                      <span className="line-through">{plan.cta}</span>
                    </Button>
                  ) : (
                    <Link to="/auth">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg py-3 rounded-xl shadow-lg">
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSectionLanding;