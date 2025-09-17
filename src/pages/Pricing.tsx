import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useTranslation } from 'react-i18next';
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";
import { StripeCheckout } from "@/components/StripeCheckout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Pricing = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, profile } = useUserProfile();
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [stripeProducts, setStripeProducts] = useState<any>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Function to highlight "Assistant" in blue
  const highlightAssistance = (text: string) => {
    if (text.includes('Assistant')) {
      const parts = text.split('Assistant');
      return (
        <>
          {parts[0]}
          <span className="text-cuizly-assistant font-semibold">Assistant</span>
          {parts.slice(1).join('Assistant')}
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

  // Create Stripe products
  const createStripeProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-products');
      
      if (error) {
        console.error('Erreur lors de la création des produits Stripe:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer les produits Stripe.",
          variant: "destructive",
        });
        return;
      }

      setStripeProducts(data.products);
      toast({
        title: "Produits créés",
        description: "Les produits Stripe ont été créés avec succès.",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de la création des produits.",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    if (!stripeProducts) {
      createStripeProducts();
    }
  }, []);
  
  const plans = [
    {
      id: 'basic',
      title: "Cuizly Basique",
      subtitle: "L'assistant culinaire intelligent pour découvrir Montréal",
      monthlyPrice: 19.99,
      yearlyPrice: 199.90,
      popular: true,
      features: [
        "Assistant culinaire intelligent",
        "Recommandations personnalisées de restaurants",
        "Interface vocale intuitive",
        "Recherche avancée par quartier",
        "Support client standard"
      ],
      cta: "Commencer avec Basique",
      userType: 'consumer'
    },
    {
      id: 'pro',
      title: "Cuizly Pro",
      subtitle: "La plateforme complète pour restaurateurs",
      monthlyPrice: 49.99,
      yearlyPrice: 499.90,
      priceNote: "Économisez $99.98 avec l'abonnement annuel",
      features: [
        "Tableau de bord analytics complet",
        "Gestion d'offres et promotions",
        "Notifications client automatisées", 
        "Outils marketing avancés",
        "Support prioritaire 24/7",
        "Intégrations avancées"
      ],
      cta: "Upgrade vers Pro",
      userType: 'restaurant_owner'
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
            Choisissez votre plan Cuizly
          </h1>
          <p className="text-lg sm:text-xl text-cuizly-neutral max-w-3xl mx-auto px-2 sm:px-4">
            Découvrez la meilleure expérience culinaire de Montréal avec nos plans adaptés à vos besoins
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex justify-center">
            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Mensuel</TabsTrigger>
                <TabsTrigger value="yearly" className="relative">
                  Annuel
                  <Badge className="ml-2 bg-cuizly-assistant text-white text-xs">
                    Économisez
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start mb-4">
          {plans.map((plan, index) => {
            const currentPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const savings = billingCycle === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
            const priceId = stripeProducts ? 
              (plan.id === 'basic' ? 
                (billingCycle === 'monthly' ? stripeProducts.basic.prices.monthly.id : stripeProducts.basic.prices.yearly.id) :
                (billingCycle === 'monthly' ? stripeProducts.pro.prices.monthly.id : stripeProducts.pro.prices.yearly.id)
              ) : null;

            return (
              <Card key={index} className={`relative shadow-card border ${
                plan.id === 'pro' ? 'border-cuizly-pro ring-2 ring-cuizly-pro/20' : 
                'border-border'
              } ${plan.popular ? 'ring-2 ring-foreground' : ''} h-fit`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background">
                    Plus populaire
                  </Badge>
                )}
                {billingCycle === 'yearly' && savings > 0 && (
                  <Badge className="absolute -top-3 right-4 bg-cuizly-assistant text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Économisez ${savings.toFixed(2)}
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-foreground">{plan.title}</CardTitle>
                  <p className="text-cuizly-neutral text-sm sm:text-base">{plan.subtitle}</p>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground mt-3 sm:mt-4">
                    ${currentPrice.toFixed(2)} CAD
                    <span className="text-sm font-normal text-cuizly-neutral">
                      /{billingCycle === 'monthly' ? 'mois' : 'année'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && plan.priceNote && (
                    <p className="text-xs sm:text-sm text-cuizly-neutral">{plan.priceNote}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 sm:space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2 sm:space-x-3">
                        <Check className="h-4 w-4 text-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Stripe Checkout Integration */}
                  {isAuthenticated ? (
                    // Show profile switch modal if wrong user type
                    (plan.userType !== profile?.user_type) ? (
                      <Button 
                        className={`w-full text-sm sm:text-base ${
                          plan.id === 'basic' ? 'bg-foreground hover:bg-foreground/90 text-background' : 
                          'bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground'
                        }`}
                        onClick={(e) => handleCTAClick(e, index)}
                      >
                        {plan.cta}
                      </Button>
                    ) : (
                      // Show Stripe checkout if correct user type and products loaded
                      priceId ? (
                        <StripeCheckout 
                          priceId={priceId}
                          planName={plan.title}
                          planPrice={`$${currentPrice} CAD`}
                          className={`w-full text-sm sm:text-base ${
                            plan.id === 'basic' ? 'bg-foreground hover:bg-foreground/90 text-background' : 
                            'bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground'
                          }`}
                        >
                          {plan.cta}
                        </StripeCheckout>
                      ) : (
                        <Button 
                          className={`w-full text-sm sm:text-base ${
                            plan.id === 'basic' ? 'bg-foreground hover:bg-foreground/90 text-background' : 
                            'bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground'
                          }`}
                          disabled={productsLoading}
                        >
                          {productsLoading ? 'Chargement...' : plan.cta}
                        </Button>
                      )
                    )
                  ) : (
                    // Not authenticated - redirect to auth
                    <Link to={plan.id === 'basic' ? "/auth" : "/auth?type=restaurant&tab=signup"}>
                      <Button className={`w-full text-sm sm:text-base ${
                        plan.id === 'basic' ? 'bg-foreground hover:bg-foreground/90 text-background' : 
                        'bg-cuizly-pro hover:bg-cuizly-pro/90 text-cuizly-pro-foreground'
                      }`}>
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
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