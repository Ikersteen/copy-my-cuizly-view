import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const HowItWorksSection = () => {
  const { t } = useTranslation();
  
  // Fonction pour mettre en évidence "Assistant" en bleu
  const highlightAssistance = (text: string) => {
    const parts = text.split('Assistant');
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <span className="text-cuizly-assistant font-semibold">Assistant</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };
  
  const steps = [
    {
      icon: "🍻",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description')
    },
    {
      icon: "🍽️",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description')
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Content */}
        <div className="mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6 text-center">
            {t('howItWorks.title')}
          </h2>
          <p className="text-base sm:text-lg text-cuizly-neutral mb-8 sm:mb-12 leading-relaxed text-center px-2 sm:px-4 max-w-4xl mx-auto">
            {highlightAssistance(t('howItWorks.subtitle'))}
          </p>

          {/* Demo Image */}
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl shadow-xl p-6 border">
              <img 
                src="/lovable-uploads/cuizly-assistance-interface.png" 
                alt="Interface Cuizly Assistant" 
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
            {steps.map((step, index) => {
              // Don't render the card if both title and description are empty
              if (!step.title && !step.description) {
                return null;
              }
              
              return (
                <Card key={index} className="border-primary/10 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cuizly-primary to-cuizly-accent flex items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-xl">{step.icon}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm sm:text-base text-cuizly-neutral leading-relaxed">
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