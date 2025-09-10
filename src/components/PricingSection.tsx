import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const PricingSection = () => {
  const { t } = useTranslation();
  
  const plans = [
    {
      type: "consumer",
      title: t('pricing.consumer.title'),
      subtitle: t('pricing.consumer.subtitle'),
      price: t('pricing.consumer.price'),
      popular: true,
      features: t('pricing.consumer.features', { returnObjects: true }) as string[],
      cta: t('pricing.consumer.cta')
    },
    {
      type: "pro",
      title: t('pricing.pro.title'),
      subtitle: t('pricing.pro.subtitle'),
      price: t('pricing.pro.price'),
      priceNote: t('pricing.pro.priceNote'),
      features: t('pricing.pro.features', { returnObjects: true }) as string[],
      cta: t('pricing.pro.cta')
    },
    {
      type: "analytics",
      title: t('pricing.analytics.title'),
      subtitle: t('pricing.analytics.subtitle'),
      price: t('pricing.analytics.price'),
      priceNote: t('pricing.analytics.priceNote'),
      comingSoon: true,
      features: t('pricing.analytics.features', { returnObjects: true }) as string[],
      cta: t('pricing.analytics.cta')
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-cuizly-neutral max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Consumer Section */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">{t('pricing.consumerSection')}</h3>
          <Card className="max-w-md bg-background/60 backdrop-blur-sm shadow-card border border-border/50 relative">
            <Badge className="absolute -top-3 left-6 bg-cuizly-accent text-white">
              {t('pricing.popular')}
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
              
                <Button 
                  className="w-full bg-cuizly-accent hover:bg-cuizly-accent/90 text-white"
                  onClick={() => window.location.href = '/auth'}
                >
                  {plans[0].cta}
                </Button>
            </div>
          </Card>
        </div>

        {/* Restaurant Section */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6">{t('pricing.restaurantSection')}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {plans.slice(1).map((plan, index) => (
              <Card key={index} className="p-8 bg-background/60 backdrop-blur-sm shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 relative">
                {plan.comingSoon && (
                  <Badge className="absolute -top-3 left-6 bg-destructive text-destructive-foreground animate-none pointer-events-none">
                    {t('pricing.comingSoon')}
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
                
                <Button 
                  className="w-full bg-cuizly-primary hover:bg-cuizly-primary/90 text-white"
                  onClick={() => window.location.href = plan.type === 'pro' ? '/auth?type=restaurant&tab=signup' : '/waitlist'}
                >
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