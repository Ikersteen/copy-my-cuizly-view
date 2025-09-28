import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";  
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ChevronLeft, Settings, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

const IOSHeader = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, isConsumer, isRestaurant, loading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Get localized routes
  const authRoute = useLocalizedRoute('/auth');
  const homeRoute = useLocalizedRoute('/');
  
  const isHomePage = location.pathname === '/' || location.pathname === '/fr';
  
  // iOS-style logo
  const getLogoSrc = () => {
    return "/cuizly-logo-official.png";
  };

  // iOS-style navigation header
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
      {/* iOS Status Bar Safe Area */}
      <div className="h-safe-top bg-background/80"></div>
      
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center min-w-0 flex-1">
            {!isHomePage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-accent/50 rounded-full"
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
                <span className="sr-only">Retour</span>
              </Button>
            ) : (
              <a 
                href="/"
                className="flex items-center group cursor-pointer"
              >
                <img 
                  src={getLogoSrc()} 
                  alt="Cuizly" 
                  className="h-10 w-auto transition-all duration-200 group-active:scale-95"
                />
              </a>
            )}
          </div>

          {/* Center Section - Title */}
          <div className="flex-1 text-center">
            {!isHomePage && (
              <h1 className="text-lg font-semibold text-foreground truncate">
                {t('navigation.cuizly')}
              </h1>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center justify-end min-w-0 flex-1">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* Profile Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-accent/50 rounded-full"
                >
                  <User className="h-5 w-5 text-primary" />
                </Button>
                {/* Settings Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-accent/50 rounded-full"
                >
                  <Settings className="h-5 w-5 text-primary" />
                </Button>
              </div>
            ) : (
              <Link to={authRoute}>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-medium shadow-sm active:scale-95 transition-all duration-200"
                >
                  {t('navigation.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default IOSHeader;