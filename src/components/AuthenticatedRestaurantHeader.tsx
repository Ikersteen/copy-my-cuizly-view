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
    <>
      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleAction(onNewOfferClick)}
          className="gap-1 px-3"
        >
          <Plus className="h-4 w-4" />
          Nouvelle offre
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleAction(onRestaurantProfileClick)}
          className="gap-1 px-3"
        >
          <ChefHat className="h-4 w-4" />
          Profil restaurant
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleAction(onManageMenusClick)}
          className="gap-1 px-3"
        >
          <BookOpen className="h-4 w-4" />
          Gérer les menus
        </Button>
        
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
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="gap-1 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </>
  );
};