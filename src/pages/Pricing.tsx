import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Pricing = () => {
  const plans = [
    {
      title: "Cuizly Basique",
      subtitle: "Pour les gourmets",
      price: "Gratuit",
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
      subtitle: "Pour restaurants",
      price: "59$ CAD/mois",
      priceNote: "ou 499$ CAD/an (économisez 2 mois !)",
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
      title: "Cuizly Analytics+",
      subtitle: "Pour optimiser avec les données",
      price: "349$ CAD/trimestre",
      priceNote: "ou 999$ CAD/an (économisez 47$ !)",
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
            Des tarifs pensés pour tous
          </h1>
          <p className="text-lg sm:text-xl text-cuizly-neutral max-w-3xl mx-auto px-2 sm:px-4">
            Une offre gratuite pour les gourmets, des solutions professionnelles abordables pour les restaurateurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative shadow-card border border-border ${plan.popular ? 'ring-2 ring-foreground' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background">
                  Populaire
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
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-2 sm:space-x-3">
                      <Check className="h-4 w-4 text-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full bg-foreground hover:bg-foreground/90 text-background text-sm sm:text-base">
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;