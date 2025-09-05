import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plus, ChefHat, BookOpen, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface RestaurantMobileMenuProps {
  onNewOfferClick: () => void;
  onRestaurantProfileClick: () => void;
  onManageMenusClick: () => void;
}

export const RestaurantMobileMenu = ({
  onNewOfferClick,
  onRestaurantProfileClick,
  onManageMenusClick,
}: RestaurantMobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

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
                onClick={() => handleMenuClick(onNewOfferClick)}
              >
                <Plus className="h-5 w-5 mr-3" />
                <span className="text-base">{t('dashboard.newOffer')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(onRestaurantProfileClick)}
              >
                <ChefHat className="h-5 w-5 mr-3" />
                <span className="text-base">{t('dashboard.restaurantProfile')}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleMenuClick(onManageMenusClick)}
              >
                <BookOpen className="h-5 w-5 mr-3" />
                <span className="text-base">{t('dashboard.manageMenus')}</span>
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
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};