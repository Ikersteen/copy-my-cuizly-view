import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const PricingSectionLanding = () => {
  const { t } = useTranslation();
  
  const plans = [
    {
      titleKey: "pricing.consumer.title",
      subtitleKey: "pricing.consumer.subtitle", 
      priceKey: "pricing.consumer.price",
      popular: true,
      featuresKeys: [
        "pricing.consumer.features.0",
        "pricing.consumer.features.1", 
        "pricing.consumer.features.2",
        "pricing.consumer.features.3",
        "pricing.consumer.features.4"
      ],
      ctaKey: "pricing.consumer.cta"
    },
    {
      titleKey: "pricing.pro.title",
      subtitleKey: "pricing.pro.subtitle",
      priceKey: "pricing.pro.price",
      priceNoteKey: "pricing.pro.priceNote",
      comingSoon: true,
      featuresKeys: [
        "pricing.pro.features.0",
        "pricing.pro.features.1",
        "pricing.pro.features.2", 
        "pricing.pro.features.3",
        "pricing.pro.features.4"
      ],
      ctaKey: "pricing.pro.cta"
    },
    {
      titleKey: "pricing.analytics.title",
      subtitleKey: "pricing.analytics.subtitle",
      priceKey: "pricing.analytics.price",
      priceNoteKey: "pricing.analytics.priceNote", 
      comingSoon: true,
      featuresKeys: [
        "pricing.analytics.features.0",
        "pricing.analytics.features.1",
        "pricing.analytics.features.2",
        "pricing.analytics.features.3", 
        "pricing.analytics.features.4"
      ],
      ctaKey: "pricing.analytics.cta"
    }
  ];

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 mobile-friendly-spacing">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            {t('pricingLanding.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-cuizly-neutral max-w-3xl mx-auto px-4 sm:px-6">
            {t('pricingLanding.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start mobile-grid">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative shadow-card border border-border mobile-card-spacing touch-spacing ${plan.popular ? 'ring-2 ring-foreground' : ''} ${index === 2 ? 'lg:col-span-1' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-3 py-1">
                  {t('pricingLanding.popular')}
                </Badge>
              )}
              {plan.comingSoon && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground animate-none pointer-events-none px-3 py-1">
                  {t('pricingLanding.comingSoon')}
                </Badge>
              )}
              <CardHeader className="text-center pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">{t(plan.titleKey)}</CardTitle>
                <p className="text-cuizly-neutral text-sm sm:text-base px-2">{t(plan.subtitleKey)}</p>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-3 sm:mt-4">{t(plan.priceKey)}</div>
                {plan.priceNoteKey && (
                  <p className="text-xs sm:text-sm text-cuizly-neutral px-2">{t(plan.priceNoteKey)}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 sm:space-y-3 mb-6 px-2">
                  {plan.featuresKeys.map((featureKey, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-2 sm:space-x-3">
                      <Check className="h-4 w-4 text-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground leading-relaxed">{t(featureKey)}</span>
                    </li>
                  ))}
                </ul>
                <Link to={index === 0 ? "/auth" : index === 1 ? "/auth?type=restaurant&tab=signup" : "/waitlist"}>
                  <Button className={`mobile-button touch-device focus-touch ${index === 0 ? 'bg-foreground hover:bg-foreground/90 text-background' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>
                    {t(plan.ctaKey)}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSectionLanding;