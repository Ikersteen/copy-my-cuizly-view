import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from 'react-i18next';
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const { t } = useTranslation();
  const { isAuthenticated, profile } = useUserProfile();
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const navigate = useNavigate();

  // Function to highlight "Assistance" in blue
  const highlightAssistance = (text: string) => {
    if (text.includes('Assistance')) {
      const parts = text.split('Assistance');
      return (
        <>
          {parts[0]}
          <span className="text-cuizly-assistant font-semibold">Assistance</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  const handleCTAClick = (e: React.MouseEvent, planIndex: number) => {
    if (isAuthenticated) {
      // Consumer plan: show modal only if user is restaurant_owner profile
      if (planIndex === 0 && profile?.user_type === 'restaurant_owner') {
        e.preventDefault();
        setShowProfileSwitch(true);
      }
      // Pro plan: show modal only if user is consumer profile  
      else if (planIndex === 1 && profile?.user_type === 'consumer') {
        e.preventDefault();
        setShowProfileSwitch(true);
      }
    }
  };

  const handleSwitchToRestaurant = () => {
    navigate('/auth');
  };

  const handleSwitchToConsumer = () => {
    navigate('/auth');
  };
  
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
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start mb-4">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative shadow-card border ${
              index === 1 ? 'border-cuizly-pro ring-2 ring-cuizly-pro/20' : 
              'border-border'
            } ${plan.popular ? 'ring-2 ring-foreground' : ''} h-fit`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background">
                  {t('pricingLanding.popular')}
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
                      <span className="text-xs sm:text-sm text-foreground">
                        {highlightAssistance(t(featureKey))}
                      </span>
                    </li>
                  ))}
                </ul>
                {/* Consumer plan: show modal if authenticated and on restaurant_owner profile */}
                {isAuthenticated && index === 0 && profile?.user_type === 'restaurant_owner' ? (
                  <Button 
                    className="w-full text-sm sm:text-base bg-foreground hover:bg-foreground/90 text-background"
                    onClick={(e) => handleCTAClick(e, index)}
                  >
                    {t(plan.ctaKey)}
                  </Button>
                ) : 
                /* Pro plan: show modal if authenticated and on consumer profile */
                isAuthenticated && index === 1 && profile?.user_type === 'consumer' ? (
                  <Button 
                    className="w-full text-sm sm:text-base bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground"
                    onClick={(e) => handleCTAClick(e, index)}
                  >
                    {t(plan.ctaKey)}
                  </Button>
                ) : (
                  <Link to={index === 0 ? "/auth" : "/auth?type=restaurant&tab=signup"}>
                    <Button className={`w-full text-sm sm:text-base ${
                      index === 0 ? 'bg-foreground hover:bg-foreground/90 text-background' : 
                      'bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground'
                    }`}>
                      {t(plan.ctaKey)}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Switch Modal */}
        {isAuthenticated && (
          <ProfileSwitchModal
            open={showProfileSwitch}
            onOpenChange={setShowProfileSwitch}
            currentProfile={profile?.user_type || 'consumer'}
          />
        )}
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Pricing;