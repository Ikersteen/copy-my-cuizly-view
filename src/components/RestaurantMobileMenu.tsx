import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plus, ChefHat, BookOpen, LayoutDashboard, LogOut, Globe, Home } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface RestaurantMobileMenuProps {
  onNewOfferClick: () => void;
  onRestaurantProfileClick: () => void;
  onMenusClick: () => void;
}

export const RestaurantMobileMenu = ({
  onNewOfferClick,
  onRestaurantProfileClick,
  onMenusClick,
}: RestaurantMobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: t('dashboard.logoutSuccess'),
        description: t('dashboard.logoutSuccessDesc'),
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t('dashboard.logoutError'),
        description: t('dashboard.logoutErrorDesc'),
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('navigation.restaurantMenu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-cuizly-primary">
                {t('navigation.restaurantMenu')}
              </h2>
            </div>

            {/* Main Menu Items */}
            <div className="flex-1 flex flex-col space-y-2 py-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => navigate('/'))}
              >
                <Home className="h-5 w-5 mr-3" />
                <span className="text-base">{t('navigation.back_home')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(onNewOfferClick)}
              >
                <Plus className="h-5 w-5 mr-3" />
                <span className="text-base">Nouvelle offre</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(onRestaurantProfileClick)}
              >
                <ChefHat className="h-5 w-5 mr-3" />
                <span className="text-base">Profil du restaurant</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(onMenusClick)}
              >
                <BookOpen className="h-5 w-5 mr-3" />
                <span className="text-base">Gérer les menus</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => {
                  console.log('Clicking dashboard button, navigating to /dashboard');
                  navigate('/dashboard');
                })}
              >
                <LayoutDashboard className="h-5 w-5 mr-3" />
                <span className="text-base">{t('navigation.dashboard')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="text-base">{t('dashboard.logout')}</span>
              </Button>
            </div>

            {/* Bottom Section - Language */}
            <div className="border-t border-border pt-4 space-y-4">
              {/* Language Selector */}
              <div className="space-y-2 pb-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('navigation.languageSelector')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={currentLanguage === 'fr' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      changeLanguage('fr');
                      setIsOpen(false);
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
                      setIsOpen(false);
                    }}
                  >
                    🇬🇧 EN
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};