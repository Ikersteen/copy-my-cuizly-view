import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from 'react-i18next';

const Pricing = () => {
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-4 sm:mb-6">
          <Link to="/" className="inline-flex items-center text-cuizly-neutral hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('pricingLanding.backToHome')}
          </Link>
        </div>
        
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t('pricingLanding.title')}
          </h1>
          <p className="text-lg sm:text-xl text-cuizly-neutral max-w-3xl mx-auto px-2 sm:px-4">
            {t('pricingLanding.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start mb-4">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative shadow-card border ${
              index === 1 ? 'border-cuizly-pro ring-2 ring-cuizly-pro/20' : 
              index === 2 ? 'border-cuizly-analytics ring-2 ring-cuizly-analytics/20' : 
              'border-border'
            } ${plan.popular ? 'ring-2 ring-foreground' : ''} ${index < 2 ? 'h-fit' : ''} ${index === 2 ? 'md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background">
                  {t('pricingLanding.popular')}
                </Badge>
              )}
              {plan.comingSoon && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground animate-none pointer-events-none">
                  {t('pricingLanding.comingSoon')}
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-foreground">{t(plan.titleKey)}</CardTitle>
                <p className="text-cuizly-neutral text-sm sm:text-base">{t(plan.subtitleKey)}</p>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mt-3 sm:mt-4">{t(plan.priceKey)}</div>
                {plan.priceNoteKey && (
                  <p className="text-xs sm:text-sm text-cuizly-neutral">{t(plan.priceNoteKey)}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 sm:space-y-3 mb-6">
                  {plan.featuresKeys.map((featureKey, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-2 sm:space-x-3">
                      <Check className="h-4 w-4 text-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground">{t(featureKey)}</span>
                    </li>
                  ))}
                </ul>
                <Link to={index === 0 ? "/auth" : index === 1 ? "/auth?type=restaurant&tab=signup" : "/waitlist"}>
                  <Button className={`w-full text-sm sm:text-base ${
                    index === 0 ? 'bg-foreground hover:bg-foreground/90 text-background' : 
                    index === 1 ? 'bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground' :
                    'bg-cuizly-analytics hover:bg-cuizly-analytics/90 text-cuizly-analytics-foreground'
                  }`}>
                    {t(plan.ctaKey)}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Pricing;