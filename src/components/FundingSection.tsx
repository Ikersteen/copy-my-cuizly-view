import { Target, Rocket, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FundingSection = () => {
  const fundingUse = [
    {
      icon: Rocket,
      title: "Acquisition utilisateurs",
      percentage: "40%",
      amount: "$400K",
      description: "Marketing digital, partenariats, croissance organique",
      color: "text-cuizly-primary"
    },
    {
      icon: TrendingUp,
      title: "Développement produit",
      percentage: "30%",
      amount: "$300K", 
      description: "IA avancée, nouvelles features, mobile app",
      color: "text-cuizly-accent"
    },
    {
      icon: Target,
      title: "Expansion équipe",
      percentage: "20%",
      amount: "$200K",
      description: "Développeurs, data scientists, commercial",
      color: "text-cuizly-secondary"
    },
    {
      icon: Zap,
      title: "Opérations & infrastructure",
      percentage: "10%",
      amount: "$100K",
      description: "Scaling technique, outils, infrastructure cloud",
      color: "text-cuizly-primary"
    }
  ];

  const milestones = [
    { milestone: "10K utilisateurs actifs", timeline: "6 mois", status: "target" },
    { milestone: "500 restaurants partenaires", timeline: "9 mois", status: "target" },
    { milestone: "Break-even opérationnel", timeline: "12 mois", status: "target" },
    { milestone: "Expansion Toronto/Vancouver", timeline: "18 mois", status: "future" }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary mb-4">
            Levée de <span className="text-cuizly-accent">$1M CAD</span>
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral max-w-3xl mx-auto">
            Pour accélérer notre croissance et devenir la référence de la découverte 
            culinaire au Canada dans les 24 prochains mois.
          </p>
        </div>

        {/* Funding Breakdown */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {fundingUse.map((use, index) => {
            const Icon = use.icon;
            return (
              <Card key={index} className="border-cuizly-accent/20 bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-cuizly-light/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-6 w-6 ${use.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-cuizly-primary">
                          {use.title}
                        </h3>
                        <div className="text-right">
                          <div className="text-lg font-bold text-cuizly-accent">
                            {use.percentage}
                          </div>
                          <div className="text-sm text-cuizly-secondary font-medium">
                            {use.amount}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-cuizly-neutral leading-relaxed">
                        {use.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Milestones */}
        <div className="bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8 mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-cuizly-primary mb-6 text-center">
            🎯 Objectifs avec ce financement
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {milestones.map((item, index) => (
              <div key={index} className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-sm font-bold text-cuizly-accent mb-2">
                  {item.timeline}
                </div>
                <div className="text-xs text-cuizly-neutral leading-relaxed">
                  {item.milestone}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Highlights */}
        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/5 border border-cuizly-accent/20 rounded-xl p-6">
            <h4 className="text-lg font-bold text-cuizly-primary mb-4">
              💎 Pourquoi investir maintenant
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cuizly-neutral">Marché en croissance explosive (+12% annuel)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cuizly-neutral">Product-market fit démontré (97% satisfaction)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cuizly-neutral">Équipe éprouvée avec track record</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-cuizly-accent rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-cuizly-neutral">Technologie IA différenciante et défendable</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-cuizly-accent/20 rounded-xl p-6">
            <h4 className="text-lg font-bold text-cuizly-primary mb-4">
              🚀 Retour potentiel
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cuizly-neutral">Valorisation actuelle</span>
                <span className="font-semibold text-cuizly-primary">$5M CAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cuizly-neutral">Valorisation cible (24 mois)</span>
                <span className="font-semibold text-cuizly-primary">$25M CAD</span>
              </div>
              <div className="flex justify-between border-t border-cuizly-accent/20 pt-2">
                <span className="text-cuizly-accent font-semibold">Upside potentiel</span>
                <span className="font-bold text-cuizly-accent">5x en 2 ans</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-cuizly-primary/10 to-cuizly-accent/10 border border-cuizly-accent/20 rounded-xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-cuizly-primary mb-4">
            Prêt à révolutionner la food-tech canadienne ?
          </h3>
          <p className="text-cuizly-neutral mb-6 leading-relaxed max-w-2xl mx-auto">
            Rejoignez-nous dans cette aventure exceptionnelle. Les premiers investisseurs 
            auront accès à des conditions préférentielles et à notre advisory board.
          </p>
          <Button 
            size="lg" 
            className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white px-8 py-3 text-lg font-semibold"
          >
            Demander le pitch deck complet
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FundingSection;