import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Clock, Star, Heart, Settings, 
  TrendingUp, Zap, Gift, History, User as UserIcon, LogOut, Map
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useOffers } from "@/hooks/useOffers";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { PreferencesModal } from "@/components/PreferencesModal";
import { ProfileModal } from "@/components/ProfileModal";
import { FavoritesModal } from "@/components/FavoritesModal";
import { HistoryModal } from "@/components/HistoryModal";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { EnhancedRecommendationEngine } from "@/components/EnhancedRecommendationEngine";
import { AllMenusSection } from "@/components/AllMenusSection";
import { SavedFavoritesSection } from "@/components/SavedFavoritesSection";
import { OffersSection } from "@/components/OffersSection";
import RestaurantMapSection from "@/components/RestaurantMapSection";
import cuizlyLogo from "@/assets/cuizly-logo-new.png";
import type { User } from "@supabase/supabase-js";

const ConsumerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const { preferences, loading: preferencesLoading } = useUserPreferences();
  const { profile, loading: profileLoading } = useProfile();
  const { offers: allOffers } = useOffers();
  const { offers: trendingOffers } = useOffers('trending');
  const { offers: fastOffers } = useOffers('fast');
  const { offers: promotionOffers } = useOffers('promotion');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();
  }, []);

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
      // Clear local storage and session data first
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state and redirect
      }
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur Cuizly !"
      });
      
      // Close any open modals
      setShowProfile(false);
      setShowPreferences(false);
      setShowFavorites(false);
      setShowHistory(false);
      
      // Clear user state
      setUser(null);
      
      // Force redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout even on error
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.location.href = "/";
    }
  };

  if (loading || preferencesLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 flex items-center justify-center animate-pulse mx-auto">
            <img src={cuizlyLogo} alt="Cuizly" className="w-16 h-16 object-contain" />
          </div>
          <p className="text-muted-foreground animate-pulse">Chargement de votre expérience personnalisée...</p>
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
                  Bonjour {profile?.first_name || profile?.username || user?.email?.split('@')[0]} ! {profile?.chef_emoji_color || '👋'}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {user?.email}
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
                <span className="text-xs sm:text-sm">Profil</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="px-3 py-2 h-10"
              >
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Préférences</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="px-3 py-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-11">
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm px-2 py-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Recommandations</span>
              <span className="xs:hidden">Reco</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs sm:text-sm px-2 py-2">
              <Map className="h-4 w-4 mr-1" />
              Carte
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm px-2 py-2">
              <Heart className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Favoris</span>
              <span className="xs:hidden">♥</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs sm:text-sm px-2 py-2">
              <Gift className="h-4 w-4 mr-1" />
              Offres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-6">
            <PersonalizedRecommendations />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Carte des restaurants
              </h2>
              <p className="text-muted-foreground">
                Explorez les restaurants autour de vous à Montréal
              </p>
            </div>
            <RestaurantMapSection />
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <SavedFavoritesSection />
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
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