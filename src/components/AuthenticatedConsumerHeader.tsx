import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, Gift, LogOut, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateUserUrl } from "@/lib/urlUtils";

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile: userProfile } = useProfile();
  const { profile } = useUserProfile();

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
      // Navigate to personalized dashboard
      if (profile && userProfile) {
        const personalizedUrl = generateUserUrl(
          profile.user_type,
          userProfile,
          null,
          i18n.language
        );
        navigate(personalizedUrl);
      } else {
        // Fallback to generic dashboard
        navigate("/dashboard");
      }
    }
  };

  return null;
};