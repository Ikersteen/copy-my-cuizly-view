import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";  
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Menu, X, Globe, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AuthenticatedConsumerHeader } from "@/components/AuthenticatedConsumerHeader";
import { AuthenticatedRestaurantHeader } from "@/components/AuthenticatedRestaurantHeader";
import { ConsumerMobileMenu } from "@/components/ConsumerMobileMenu";
import { RestaurantMobileMenu } from "@/components/RestaurantMobileMenu";
import { PreferencesModal } from "@/components/PreferencesModal";
import { ProfileModal } from "@/components/ProfileModal";
import { NewOfferModal } from "@/components/NewOfferModal";
import { RestaurantProfileModal } from "@/components/ImprovedRestaurantProfileModal";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";
import { MenusModal } from "@/components/MenusModal";

const Header = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, profile, isAuthenticated, isConsumer, isRestaurant, loading } = useUserProfile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewOffer, setShowNewOffer] = useState(false);
  const [showRestaurantProfile, setShowRestaurantProfile] = useState(false);
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const [showMenus, setShowMenus] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setIsSheetOpen(false);
    navigate(path);
  };

  const handleSwitchToRestaurant = () => {
    navigate('/auth');
  };

  const handleSwitchToConsumer = () => {
    navigate('/auth');
  };

  // Don't render anything while loading user profile
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-6 sm:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                to="/"
                className="flex items-center py-2 cursor-pointer group"
                onClick={() => window.location.href = '/'}
              >
                <img 
                  src="/lovable-uploads/9727855b-56d5-4c89-93e2-8d3e2e8eae1e.png" 
                  alt="Cuizly" 
                  className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:hidden"
                />
                <img 
                  src="/lovable-uploads/2ca03ecc-31e6-42ef-89bf-9532213d22eb.png" 
                  alt="Cuizly" 
                  className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 hidden dark:block"
                />
              </Link>
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
      <div className="w-full px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Extrême gauche */}
          <div className="flex-shrink-0">
            <Link 
              to="/"
              className="flex items-center py-2 cursor-pointer group"
            >
              <img 
                src="/lovable-uploads/9727855b-56d5-4c89-93e2-8d3e2e8eae1e.png" 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:hidden"
              />
              <img 
                src="/lovable-uploads/2ca03ecc-31e6-42ef-89bf-9532213d22eb.png" 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 hidden dark:block"
              />
            </Link>
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
              <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                {/* Theme Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 px-2">
                      {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setTheme('light')}
                      className={theme === 'light' ? 'bg-accent' : ''}
                    >
                      ☀️ {t('theme.light')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme('dark')}
                      className={theme === 'dark' ? 'bg-accent' : ''}
                    >
                      🌙 {t('theme.dark')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme('system')}
                      className={theme === 'system' ? 'bg-accent' : ''}
                    >
                      💻 {t('theme.system')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 px-2">
                      <Globe className="h-4 w-4" />
                      <span className="uppercase text-xs font-medium">
                        {currentLanguage}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => changeLanguage('fr')}
                      className={currentLanguage === 'fr' ? 'bg-accent' : ''}
                    >
                      🇫🇷 Français
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changeLanguage('en')}
                      className={currentLanguage === 'en' ? 'bg-accent' : ''}
                    >
                      🇬🇧 English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Link to="/auth">
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
                    onProfileClick={() => setShowProfile(true)}
                    onPreferencesClick={() => setShowPreferences(true)}
                    onOffersClick={() => navigate("/dashboard")}
                  />
                )}
                {isRestaurant && (
                  <RestaurantMobileMenu 
                    onNewOfferClick={() => setShowNewOffer(true)}
                    onRestaurantProfileClick={() => setShowRestaurantProfile(true)}
                    onMenusClick={() => setShowMenus(true)}
                  />
                )}
              </>
            ) : (
              // Public mobile menu
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
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
                    
                    {/* Mobile Theme Selector */}
                    <div className="py-2 border-b border-border">
                      <div className="flex items-center gap-2 mb-2">
                        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="text-sm font-medium">{t('navigation.theme')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setTheme('light');
                            setIsSheetOpen(false);
                          }}
                        >
                          ☀️
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setTheme('dark');
                            setIsSheetOpen(false);
                          }}
                        >
                          🌙
                        </Button>
                        <Button
                          variant={theme === 'system' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setTheme('system');
                            setIsSheetOpen(false);
                          }}
                        >
                          💻
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Language Selector */}
                    <div className="py-2 border-b border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('navigation.languageSelector')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={currentLanguage === 'fr' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            changeLanguage('fr');
                            setIsSheetOpen(false);
                          }}
                        >
                          🇫🇷 FR
                        </Button>
                        <Button
                          variant={currentLanguage === 'en' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            changeLanguage('en');
                            setIsSheetOpen(false);
                          }}
                        >
                          🇬🇧 EN
                        </Button>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        className="w-full bg-foreground hover:bg-foreground/90 text-background text-lg"
                        onClick={() => handleNavigate("/auth")}
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
              <ProfileModal 
                open={showProfile} 
                onOpenChange={setShowProfile}
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
                onUpdate={() => {}}
              />
              <MenusModal 
                open={showMenus}
                onOpenChange={setShowMenus}
                restaurantId={null}
                onSuccess={() => {}}
              />
            </>
          )}
        </>
      )}
    </header>
  );
};

export default Header;