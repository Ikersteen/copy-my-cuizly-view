import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, MapPin, Star, Clock } from "lucide-react";
import aiRecommendationsImage from "@/assets/ai-recommendations.jpg";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Smartphone,
      title: "Rejoignez Cuizly dès aujourd'hui",
      description: "L'inscription est rapide et gratuite : indiquez vos préférences culinaires, et notre IA vous proposera instantanément les meilleures adresses à Montréal."
    },
    {
      icon: MapPin,
      title: "Repérez. Découvrez. Régalez-vous.",
      description: "Découvrez en temps réel les meilleures adresses culinaires de Montréal autour de vous."
    },
    {
      icon: Star,
      title: "Recevez vos recommandations",
      description: "Notre IA analyse vos goûts pour vous proposer les meilleures offres."
    },
    {
      icon: Clock,
      title: "Profitez des promos",
      description: "Réservez et profitez d'offres exclusives adaptées à votre budget."
    }
  ];

  return (
    <section className="py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-cuizly-primary mb-6">
              Comment ça fonctionne ?
            </h2>
            <p className="text-lg text-cuizly-neutral mb-12 leading-relaxed">
              Fini les recherches interminables : notre IA vous guide vers les meilleures adresses de Montréal, 
              simples, personnalisées et selon vos préférences culinaires.
            </p>

            <div className="space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={index} className="border-primary/10 bg-background/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-cuizly-primary mb-2">
                            {step.title}
                          </h3>
                          <p className="text-cuizly-neutral leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={aiRecommendationsImage} 
                alt="Intelligence artificielle pour recommandations culinaires"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating elements for visual interest */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cuizly-accent/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;