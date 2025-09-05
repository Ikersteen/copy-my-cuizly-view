import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ChefHat, BookOpen, LogOut, Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthenticatedRestaurantHeaderProps {
  onNewOfferClick?: () => void;
  onRestaurantProfileClick?: () => void;
  onManageMenusClick?: () => void;
}

export const AuthenticatedRestaurantHeader = ({
  onNewOfferClick,
  onRestaurantProfileClick,
  onManageMenusClick,
}: AuthenticatedRestaurantHeaderProps) => {
  const { theme, setTheme } = useTheme();
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
  };

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    } else {
      // Navigate to dashboard if no specific action
      navigate("/dashboard");
    }
  };

  return (
    <div className="hidden lg:flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/dashboard")}
        className="gap-2"
      >
        <ChefHat className="h-4 w-4" />
        {t('navigation.dashboard')}
      </Button>
      
      {/* Restaurant Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 px-2">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleAction(onNewOfferClick)}>
            <Plus className="h-4 w-4" />
            {t('restaurant.newOffer')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(onRestaurantProfileClick)}>
            <ChefHat className="h-4 w-4" />
            {t('restaurant.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(onManageMenusClick)}>
            <BookOpen className="h-4 w-4" />
            {t('restaurant.manageMenus')}
          </DropdownMenuItem>
          
          {/* Theme Toggle */}
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? t('theme.light') : t('theme.dark')}
          </DropdownMenuItem>
          
          {/* Language Toggle */}
          <DropdownMenuItem onClick={() => changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr')}>
            <Globe className="h-4 w-4" />
            {currentLanguage === 'fr' ? 'English' : 'Français'}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="h-4 w-4" />
            {t('navigation.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};