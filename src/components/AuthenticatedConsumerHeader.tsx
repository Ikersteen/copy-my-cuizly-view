import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, Gift, LogOut, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthenticatedConsumerHeaderProps {
  onProfileClick?: () => void;
  onPreferencesClick?: () => void;
  onOffersClick?: () => void;
}

export const AuthenticatedConsumerHeader = ({
  onProfileClick,
  onPreferencesClick,
  onOffersClick,
}: AuthenticatedConsumerHeaderProps) => {
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
            <User className="h-4 w-4" />
            {t('dashboard.myProfile')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAction(onProfileClick)}>
            <User className="mr-2 h-4 w-4" />
            {t('dashboard.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(onPreferencesClick)}>
            <Settings className="mr-2 h-4 w-4" />
            {t('dashboard.preferences')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(onOffersClick)}>
            <Gift className="mr-2 h-4 w-4" />
            {t('dashboard.offers')}
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