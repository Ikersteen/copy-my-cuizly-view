import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";  
import { useState } from "react";
import { Menu, Globe } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

import { useUserProfile } from "@/hooks/useUserProfile";
import { AuthenticatedConsumerHeader } from "@/components/AuthenticatedConsumerHeader";
import { ConsumerMobileMenu } from "@/components/ConsumerMobileMenu";
import { PreferencesModal } from "@/components/PreferencesModal";
import { ProfileModal } from "@/components/ProfileModal";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";

const Header = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, profile, isAuthenticated, loading } = useUserProfile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setIsSheetOpen(false);
    navigate(path);
  };

  // Utilise le même logo que le footer partout
  const getLogoSrc = () => {
    return "/lovable-uploads/3c5c1704-3a2b-4c77-8039-43aae95c34f9.png";
  };

  // Don't render anything while loading user profile
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                to="/"
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <img 
                  src={getLogoSrc()} 
                  alt="Cuizly" 
                  className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:filter dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
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
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Extrême gauche */}
          <div className="flex-shrink-0">
            <Link 
              to="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src={getLogoSrc()} 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:filter dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              />
            </Link>
          </div>

          {/* Navigation/Menu based on authentication status */}
          {isAuthenticated ? (
            // Authenticated user - show consumer header
            <>
              {/* Center space for authenticated users */}
              <div className="flex-1"></div>
              
              {/* Desktop: Show consumer header */}
              <AuthenticatedConsumerHeader />
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
              // Authenticated mobile menu - consumer only
              <ConsumerMobileMenu 
                onProfileClick={() => setShowProfile(true)}
                onPreferencesClick={() => setShowPreferences(true)}
              />
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
      
      {/* Consumer Modals - Only show when authenticated */}
      {isAuthenticated && (
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
    </header>
  );
};

export default Header;