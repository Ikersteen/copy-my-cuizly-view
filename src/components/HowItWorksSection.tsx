import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorksSection = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: Smartphone,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description')
    },
    {
      icon: MapPin,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description')
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Content */}
        <div className="mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 text-center">
            {t('howItWorks.title')}
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral mb-8 sm:mb-12 leading-relaxed text-center px-2 sm:px-4 max-w-4xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>

          <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="border-primary/10 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cuizly-surface rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cuizly-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
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