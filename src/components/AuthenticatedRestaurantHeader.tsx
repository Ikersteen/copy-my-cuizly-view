import { RestaurantMobileMenu } from "@/components/RestaurantMobileMenu";
import { useNavigate } from "react-router-dom";
import cuizlyLogo from "@/assets/cuizly-logo.png";

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
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/restaurant-dashboard");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src={cuizlyLogo} 
                alt="Cuizly" 
                className="h-8 w-auto"
              />
            </button>
          </div>

          {/* Menu burger */}
          <div className="flex items-center">
            <RestaurantMobileMenu
              onNewOfferClick={onNewOfferClick || (() => {})}
              onRestaurantProfileClick={onRestaurantProfileClick || (() => {})}
              onManageMenusClick={onManageMenusClick || (() => {})}
            />
          </div>
        </div>
      </div>
    </header>
  );
};