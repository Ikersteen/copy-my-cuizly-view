import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Clock, Star, Heart, Settings, 
  TrendingUp, Zap, Gift, History, User as UserIcon, LogOut, Sparkles, CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useOffers } from "@/hooks/useOffers";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { FavoritesModal } from "@/components/FavoritesModal";
import { HistoryModal } from "@/components/HistoryModal";
import { RecommendationCardsSection } from "@/components/RecommendationCardsSection";
import { AllMenusSection } from "@/components/AllMenusSection";
import { SavedFavoritesSection } from "@/components/SavedFavoritesSection";
import { OffersSection } from "@/components/OffersSection";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useLocalizedRoute } from "@/lib/routeTranslations";

import type { User } from "@supabase/supabase-js";

const ConsumerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const { preferences } = useUserPreferences();
  const { profile } = useProfile();
  const { offers: allOffers } = useOffers();
  const { offers: trendingOffers } = useOffers('trending');
  const { offers: fastOffers } = useOffers('fast');
  const { offers: promotionOffers } = useOffers('promotion');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Get localized routes
  const homeRoute = useLocalizedRoute('/');
  const cuizlyAssistantRoute = useLocalizedRoute('/cuizlyassistant');


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check session with proper error handling
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session) {
        console.log('No session found');
        return;
      }
      
      setUser(session.user);
    } catch (error) {
      console.error('Error loading consumer dashboard data:', error);
      toast({
        title: t('auth.errors.connectionError'),
        description: t('auth.errors.checkInternetConnection'),
        variant: "destructive"
      });
    }
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Promotions':
        setActiveFilter('promotion');
        break;
      case 'Favoris':
        setShowFavorites(true);
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    try {
      // Let Supabase handle auth token cleanup
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state and redirect
      }
      
      toast({
        title: t('dashboard.logoutSuccess'),
        description: t('dashboard.seeYouSoon')
      });
      
      // Close any open modals
      setShowFavorites(false);
      setShowHistory(false);
      // setShowVoiceModal removed - now redirects to /voice page
      
      // Clear user state
      setUser(null);
      
      // Redirection avec navigate au lieu de window.location.href
      navigate(homeRoute);
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout même en cas d'erreur
      setUser(null);
      navigate(homeRoute);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
              {/* Photo de profil */}
              <div className="flex justify-start">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={t('common.profile')}
                    className="w-16 h-16 sm:w-12 sm:h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center">
                    <UserIcon className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Informations du profil */}
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {t('welcome.hello')} {profile?.first_name || ""} !
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {profile?.username ? `@${profile.username}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="recommendations" className="space-y-2">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Star className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('tabs.recommendations')}</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Heart className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('tabs.favorites')}</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Gift className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('tabs.offers')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-2 mt-2">
            <RecommendationCardsSection />
          </TabsContent>

          <TabsContent value="favorites" className="space-y-2 mt-2">
            <SavedFavoritesSection />
          </TabsContent>

          <TabsContent value="offers" className="space-y-2 mt-2">
            <OffersSection userType="consumer" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <FavoritesModal 
        open={showFavorites} 
        onOpenChange={setShowFavorites}
      />
      <HistoryModal 
        open={showHistory} 
        onOpenChange={setShowHistory}
      />
      {/* VoiceAssistantModal removed - now redirects to /voice page */}

      {/* Floating Voice Assistant Button - Redirects to Cuizly Assistant */}
      <Button
        onClick={() => navigate(cuizlyAssistantRoute)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        aria-label={t('accessibility.voiceAssistant')}
      >
        <Sparkles className="w-6 h-6" />
      </Button>

    </div>
  );
};

export default ConsumerDashboard;