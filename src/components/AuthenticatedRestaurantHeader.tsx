import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ChefHat, BookOpen, LogOut, Globe } from "lucide-react";
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
    <div className="hidden lg:flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <ChefHat className="h-4 w-4" />
            {t('dashboard.restaurant')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAction(onNewOfferClick)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.newOffer')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(onRestaurantProfileClick)}>
            <ChefHat className="mr-2 h-4 w-4" />
            {t('dashboard.restaurantProfile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(onManageMenusClick)}>
            <BookOpen className="mr-2 h-4 w-4" />
            {t('dashboard.manageMenus')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('dashboard.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
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
    </div>
  );
};