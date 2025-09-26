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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden lg:flex items-center space-x-2 p-2">
          <User className="h-4 w-4" />
          <span>{t('navigation.profile')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => handleAction(onProfileClick)}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <User className="h-4 w-4" />
          <span>{t('navigation.profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(onPreferencesClick)}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Settings className="h-4 w-4" />
          <span>{t('navigation.preferences')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(onOffersClick)}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Gift className="h-4 w-4" />
          <span>{t('navigation.offers')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr')}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Globe className="h-4 w-4" />
          <span>{currentLanguage === 'fr' ? 'English' : 'Français'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center space-x-2 cursor-pointer text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('navigation.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};