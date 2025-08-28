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
    <section className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Comment ça fonctionne ?
            </h2>
            <p className="text-xl sm:text-2xl text-foreground/70 leading-relaxed max-w-4xl mx-auto">
              Fini les recherches interminables : notre IA vous guide vers les meilleures adresses de Montréal, 
              simples, personnalisées et selon vos préférences culinaires.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-8 sm:p-10">
                    <div className="flex items-start space-x-6 sm:space-x-8">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
                          <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                          {step.title}
                        </h3>
                        <p className="text-foreground/70 leading-relaxed text-lg sm:text-xl">
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