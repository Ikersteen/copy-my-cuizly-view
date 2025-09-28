import { Home, Search, Heart, User, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const IOSBottomTabBar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const homeRoute = useLocalizedRoute('/');
  const dashboardRoute = useLocalizedRoute('/dashboard');
  
  const tabs = [
    {
      id: 'home',
      icon: Home,
      label: t('navigation.home'),
      path: homeRoute,
    },
    {
      id: 'search',
      icon: Search,
      label: t('navigation.search'),
      path: '/search',
    },
    {
      id: 'map',
      icon: MapPin,
      label: t('navigation.map'),
      path: '/map',
    },
    {
      id: 'favorites',
      icon: Heart,
      label: t('navigation.favorites'),
      path: '/favorites',
      badge: 3, // Exemple de badge
    },
    {
      id: 'profile',
      icon: User,
      label: t('navigation.profile'),
      path: dashboardRoute,
    },
  ];

  const isActive = (path: string) => {
    if (path === homeRoute) {
      return location.pathname === '/' || location.pathname === '/fr';
    }
    return location.pathname === path;
  };

  const handleTabPress = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      {/* iOS Safe Area Bottom */}
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.path)}
              className={`relative flex flex-col items-center justify-center p-3 min-w-0 flex-1 active:scale-95 transition-all duration-200 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 mb-1 ${active ? 'text-primary' : 'text-muted-foreground'}`} 
                />
                
                {/* Badge */}
                {tab.badge && (
                  <Badge 
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </div>
              
              <span 
                className={`text-xs font-medium truncate ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
              
              {/* Active Indicator */}
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe Area Bottom Padding */}
      <div className="h-safe-bottom bg-background/80"></div>
    </div>
  );
};

export default IOSBottomTabBar;