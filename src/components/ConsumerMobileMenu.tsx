import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Settings, LayoutDashboard, LogOut, Home, User, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLocalizedRoute } from "@/lib/routeTranslations";

interface ConsumerMobileMenuProps {
  // Props removed as we're now using navigation
}

export const ConsumerMobileMenu = (props: ConsumerMobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get localized routes
  const homeRoute = useLocalizedRoute('/');
  const dashboardRoute = useLocalizedRoute('/dashboard');
  const reservationsRoute = useLocalizedRoute('/my-reservations');
  const profileRoute = useLocalizedRoute('/profile');
  const preferencesRoute = useLocalizedRoute('/preferences');

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate(homeRoute);
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 shadow-[0_0_10px_rgba(255,255,255,0.3)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-shadow duration-300"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('navigation.consumerMenu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-cuizly-primary">
                {t('navigation.consumerMenu')}
              </h2>
            </div>

            {/* Main Menu Items */}
            <div className="flex-1 flex flex-col space-y-2 py-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => navigate(homeRoute))}
              >
                <Home className="h-5 w-5 mr-3" />
                <span className="text-base">{t('navigation.back_home')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => navigate(profileRoute))}
              >
                <User className="h-5 w-5 mr-3" />
                <span className="text-base">{t('profile.title', 'Profil')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => navigate(preferencesRoute))}
              >
                <Settings className="h-5 w-5 mr-3" />
                <span className="text-base">{t('dashboard.preferences')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => navigate(dashboardRoute))}
              >
                <LayoutDashboard className="h-5 w-5 mr-3" />
                <span className="text-base">{t('navigation.dashboard')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(() => navigate(reservationsRoute))}
              >
                <Calendar className="h-5 w-5 mr-3" />
                <span className="text-base">{t('reservation.myReservations')}</span>
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

          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};