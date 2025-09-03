import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Clock, Star, Heart, Settings, 
  TrendingUp, Zap, Gift, History, User as UserIcon, LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useOffers } from "@/hooks/useOffers";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PreferencesModal } from "@/components/PreferencesModal";
import { ProfileModal } from "@/components/ProfileModal";
import { FavoritesModal } from "@/components/FavoritesModal";
import { HistoryModal } from "@/components/HistoryModal";
import { SwipeRecommendations } from "@/components/SwipeRecommendations";
import { RecommendationCardsSection } from "@/components/RecommendationCardsSection";
import { AllMenusSection } from "@/components/AllMenusSection";
import { SavedFavoritesSection } from "@/components/SavedFavoritesSection";
import { OffersSection } from "@/components/OffersSection";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { User } from "@supabase/supabase-js";

const ConsumerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [forceLoaded, setForceLoaded] = useState(false);
  
  const { preferences, loading: preferencesLoading } = useUserPreferences();
  const { profile, loading: profileLoading } = useProfile();
  const { offers: allOffers } = useOffers();
  const { offers: trendingOffers } = useOffers('trending');
  const { offers: fastOffers } = useOffers('fast');
  const { offers: promotionOffers } = useOffers('promotion');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  
  const { toast } = useToast();
  const { t } = useTranslation();

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached, forcing content display');
      setForceLoaded(true);
    }, 8000); // 8 seconds timeout

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    loadData();
    
    // Set up polling for better reliability
    const pollInterval = setInterval(() => {
      loadData();
    }, 300000); // Refresh every 5 minutes

    return () => {
      clearInterval(pollInterval);
    };
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
    } finally {
      setLoading(false);
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
      setShowProfile(false);
      setShowPreferences(false);
      setShowFavorites(false);
      setShowHistory(false);
      
      // Clear user state
      setUser(null);
      
      // Redirection avec navigate au lieu de window.location.href
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout même en cas d'erreur
      setUser(null);
      navigate("/");
    }
  };

  if ((loading || preferencesLoading || profileLoading) && !forceLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="xl" />
          <p className="text-muted-foreground animate-pulse">{t('dashboard.loadingPersonalizedExperience')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {t('dashboard.hello')} {profile?.first_name || ""} ! {profile?.chef_emoji_color || '👋'}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {profile?.username ? `@${profile.username}` : ""}
                </p>
                {preferences?.street && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 {preferences.street}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 self-start sm:self-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="px-3 py-2 h-10"
              >
                <UserIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{t('dashboard.profile')}</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="px-3 py-2 h-10"
              >
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{t('dashboard.preferences')}</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="px-3 py-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{t('dashboard.logout')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="swipe" className="space-y-2">
          <TabsList className="grid w-full grid-cols-4 h-11">
            <TabsTrigger value="swipe" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Heart className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Swipe</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Star className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('dashboard.recommendations')}</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Heart className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('dashboard.favorites')}</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs sm:text-sm px-2 py-2 gap-1">
              <Gift className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('dashboard.offers')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swipe" className="space-y-2 mt-2">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">🔥 Découverte Cuizly</h2>
              <p className="text-muted-foreground">
                Swipe pour découvrir des restaurants personnalisés selon vos goûts !
              </p>
            </div>
            <SwipeRecommendations />
          </TabsContent>

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
      <PreferencesModal 
        open={showPreferences} 
        onOpenChange={setShowPreferences}
      />
      <ProfileModal 
        open={showProfile} 
        onOpenChange={setShowProfile}
      />
      <FavoritesModal 
        open={showFavorites} 
        onOpenChange={setShowFavorites}
      />
      <HistoryModal 
        open={showHistory} 
        onOpenChange={setShowHistory}
      />
    </div>
  );
};

export default ConsumerDashboard;