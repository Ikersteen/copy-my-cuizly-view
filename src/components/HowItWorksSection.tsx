import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, MapPin } from "lucide-react";

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
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Content */}
        <div className="mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cuizly-primary mb-4 sm:mb-6 text-center">
            Comment ça fonctionne ?
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral mb-8 sm:mb-12 leading-relaxed text-center px-2 sm:px-4 max-w-4xl mx-auto">
            Fini les recherches interminables : notre IA vous guide vers les meilleures adresses de Montréal, 
            simples, personnalisées et selon vos préférences culinaires.
          </p>

          <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="border-primary/10 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-cuizly-primary mb-2">
                          {step.title}
                        </h3>
                        <p className="text-cuizly-neutral leading-relaxed text-sm sm:text-base">
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
      </div>
    </section>
  );
};

export default HowItWorksSection;