import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";  
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { useLocalizedRoute } from "@/lib/routeTranslations";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { AuthenticatedConsumerHeader } from "@/components/AuthenticatedConsumerHeader";
import { AuthenticatedRestaurantHeader } from "@/components/AuthenticatedRestaurantHeader";
import { ConsumerMobileMenu } from "@/components/ConsumerMobileMenu";
import { RestaurantMobileMenu } from "@/components/RestaurantMobileMenu";
import { MenusModal } from "@/components/MenusModal";
import { PreferencesModal } from "@/components/PreferencesModal";
import { NewOfferModal } from "@/components/NewOfferModal";
import { RestaurantProfileModal } from "@/components/ImprovedRestaurantProfileModal";
import { ConsumerProfileModal } from "@/components/ConsumerProfileModal";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";

const Header = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, isConsumer, isRestaurant, loading } = useUserProfile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showNewOffer, setShowNewOffer] = useState(false);
  const [showRestaurantProfile, setShowRestaurantProfile] = useState(false);
  const [showConsumerProfile, setShowConsumerProfile] = useState(false);
  const [showMenus, setShowMenus] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get localized routes
  const authRoute = useLocalizedRoute('/auth');
  const dashboardRoute = useLocalizedRoute('/dashboard');

  // Load restaurant data when user is a restaurant owner
  const loadRestaurantData = async (userId: string) => {
    try {
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (!error && restaurantData) {
        setRestaurant(restaurantData);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    }
  };

  // Load restaurant data when isRestaurant changes
  useEffect(() => {
    if (isRestaurant && user?.id) {
      loadRestaurantData(user.id);
    }
  }, [isRestaurant, user?.id]);

  const handleMenusClick = () => {
    if (!restaurant?.id) {
      toast({
        title: t('common.error'),
        description: t('dashboard.completeProfile'),
        variant: "destructive"
      });
      return;
    }
    setShowMenus(true);
  };

  const handleNavigate = (path: string) => {
    setIsSheetOpen(false);
    navigate(path);
  };

  const handleSwitchToRestaurant = () => {
    navigate(authRoute);
  };

  const handleSwitchToConsumer = () => {
    navigate(authRoute);
  };

  // Utilise le même logo que le footer partout
  const getLogoSrc = () => {
    return "/cuizly-logo-official.png";
  };

  // Don't render anything while loading user profile
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
            <a 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src={getLogoSrc()} 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:filter dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              />
            </a>
            </div>
            {/* Loading spinner or placeholder */}
            <div className="flex-1"></div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Extrême gauche */}
          <div className="flex-shrink-0">
            <a 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src={getLogoSrc()} 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:filter dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              />
            </a>
          </div>

          {/* Navigation/Menu based on authentication status */}
          {isAuthenticated ? (
            // Authenticated user - show role-specific menu
            <>
              {/* Center space for authenticated users */}
              <div className="flex-1"></div>
              
              {/* Desktop: Show role-specific header */}
              {isConsumer && <AuthenticatedConsumerHeader />}
              {isRestaurant && <AuthenticatedRestaurantHeader />}
            </>
          ) : (
            // Public navigation - show for non-authenticated users
            <>
              {/* Navigation Desktop - Centre */}
              <nav className="hidden lg:flex items-center justify-center flex-1">
                <div className="flex items-center space-x-8">
                  <button 
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                  >
                    {t('navigation.pricing')}
                  </button>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                  >
                    {t('navigation.features')}
                  </button>
                  <button 
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
                  >
                    {t('navigation.contact')}
                  </button>
                </div>
              </nav>

              {/* Auth Actions Desktop - Public */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                <Link to={authRoute}>
                  <Button size="sm" className="bg-foreground hover:bg-foreground/90 text-background">
                    {t('navigation.login')}
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Menu - Always visible */}
          <div className="flex items-center">
            {isAuthenticated ? (
              // Authenticated mobile menu - role specific
              <>
                {isConsumer && (
                  <ConsumerMobileMenu 
                    onPreferencesClick={() => setShowPreferences(true)}
                    onProfileClick={() => setShowConsumerProfile(true)}
                  />
                )}
                {isRestaurant && (
                  <RestaurantMobileMenu 
                    onNewOfferClick={() => setShowNewOffer(true)}
                    onRestaurantProfileClick={() => setShowRestaurantProfile(true)}
                    onMenusClick={handleMenusClick}
                  />
                )}
              </>
            ) : (
              // Public mobile menu
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{t('navigation.menu')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    <button
                      onClick={() => {
                        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        setIsSheetOpen(false);
                      }}
                      className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                    >
                      {t('navigation.pricing')}
                    </button>
                    <button 
                      onClick={() => {
                        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        setIsSheetOpen(false);
                      }}
                      className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                    >
                      {t('navigation.features')}
                    </button>
                    <button 
                      onClick={() => {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        setIsSheetOpen(false);
                      }}
                      className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                    >
                      {t('navigation.contact')}
                    </button>
                    <div className="pt-4">
                      <Button 
                        className="w-full bg-foreground hover:bg-foreground/90 text-background text-lg"
                        onClick={() => handleNavigate(authRoute)}
                      >
                        {t('navigation.login')}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
      {/* Profile Switch Modal */}
      {isAuthenticated && (
        <ProfileSwitchModal
          open={showProfileSwitch}
          onOpenChange={setShowProfileSwitch}
          currentProfile={profile?.user_type || 'consumer'}
        />
      )}
      
      {/* Other Modals - Only show when authenticated */}
      {isAuthenticated && (
        <>
          {isConsumer && (
            <>
              <PreferencesModal 
                open={showPreferences} 
                onOpenChange={setShowPreferences}
              />
              <ConsumerProfileModal
                isOpen={showConsumerProfile}
                onClose={() => setShowConsumerProfile(false)}
              />
            </>
          )}
          {isRestaurant && (
            <>
              <NewOfferModal 
                open={showNewOffer}
                onOpenChange={setShowNewOffer}
                restaurantId={null}
                onSuccess={() => {}}
              />
              <RestaurantProfileModal 
                open={showRestaurantProfile}
                onOpenChange={setShowRestaurantProfile}
                restaurant={null}
                onUpdate={() => {
                  if (user?.id) {
                    loadRestaurantData(user.id);
                  }
                }}
              />
              <MenusModal 
                open={showMenus}
                onOpenChange={setShowMenus}
                restaurantId={restaurant?.id || null}
                onSuccess={() => {
                  if (restaurant?.id && user?.id) {
                    loadRestaurantData(user.id);
                  }
                }}
              />
            </>
          )}
        </>
      )}
    </header>
  );
};

export default Header;