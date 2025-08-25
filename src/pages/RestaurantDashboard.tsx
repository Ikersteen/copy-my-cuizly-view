import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, MapPin, ChefHat, LogOut, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantProfileModal } from "@/components/ImprovedRestaurantProfileModal";
import { NewOfferModal } from "@/components/NewOfferModal";
import { MenusModal } from "@/components/MenusModal";
import { RestaurantFiltersModal } from "@/components/RestaurantFiltersModal";
import { OffersSection } from "@/components/OffersSection";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import cuizlyLogo from "@/assets/cuizly-logo-new.png";
import type { User } from "@supabase/supabase-js";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  is_active: boolean;
  logo_url: string;
  cover_image_url?: string;
  phone: string;
  email: string;
  price_range: string;
  delivery_radius: number;
}


const RestaurantDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMenusModal, setShowMenusModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time subscriptions for immediate updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up real-time subscriptions for user:', user.id);

    // Profile updates
    const profileChannel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🎭 Profile updated in real-time:', payload.new);
          // Force reload after profile change
          setTimeout(() => loadData(), 200);
        }
      )
      .subscribe();

    // Restaurant updates
    const restaurantChannel = supabase
      .channel(`restaurant-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🏪 Restaurant updated in real-time:', payload.new);
          setRestaurant(payload.new as Restaurant);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      profileChannel.unsubscribe();
      restaurantChannel.unsubscribe();
    };
  }, [user?.id]);

  const loadData = async () => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Get user's restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (!restaurantError && restaurantData) {
          setRestaurant(restaurantData);
        } else if (restaurantError) {
          console.error('Erreur lors du chargement du restaurant:', restaurantError);
        }

        // Note: Profile data is now handled by useProfile hook
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
    console.log('Restaurant ID:', restaurant?.id);
    switch (action) {
      case 'Nouvelle offre':
        setShowOfferModal(true);
        break;
      case 'Profil du restaurant':
        setShowProfileModal(true);
        break;
      case 'Gérer vos menus':
        if (!restaurant?.id) {
          toast({
            title: "Erreur",
            description: "Veuillez d'abord compléter votre profil de restaurant",
            variant: "destructive"
          });
          return;
        }
        setShowMenusModal(true);
        break;
      case 'Filtres':
        setShowFiltersModal(true);
        break;
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 flex items-center justify-center animate-pulse mx-auto">
            <img src={cuizlyLogo} alt="Cuizly" className="w-16 h-16 object-contain" />
          </div>
          <p className="text-muted-foreground animate-pulse">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header minimaliste */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                {restaurant?.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt="Logo restaurant"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-foreground font-semibold text-lg">
                    {restaurant?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {restaurant?.name || 'Mon Restaurant'} {profile?.chef_emoji_color || '👨‍🍳'}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  @{profile?.username || restaurant?.name?.toLowerCase().replace(/\s+/g, '') || 'restaurant'}
                </p>
                {restaurant?.address && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 self-start sm:self-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1 sm:flex-none min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Plus, label: "Nouvelle offre", primary: true },
            { icon: Edit3, label: "Profil du restaurant" },
            { icon: ChefHat, label: "Gérer vos menus" },
            { icon: Filter, label: "Filtres" }
          ].map((action, index) => (
            <Button 
              key={index}
              variant={action.primary ? "default" : "outline"} 
              className="h-16 sm:h-20 flex flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm"
              onClick={() => handleActionClick(action.label)}
            >
              <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Message de bienvenue */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Bienvenue dans votre espace restaurateur&nbsp;!
              </h3>
              <p className="text-sm text-muted-foreground">
                Gérez votre restaurant, vos offres et vos menus en toute simplicité.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section des offres */}
        <OffersSection userType="restaurant" restaurantId={restaurant?.id} />

        {/* Section analytics */}
        <AnalyticsSection restaurantId={restaurant?.id} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* Restaurant Info */}
          <div className="lg:col-span-3">
            {restaurant && (
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Informations restaurant</CardTitle>
                  <CardDescription className="text-sm">
                    Détails de votre établissement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Nom</p>
                      <p className="text-foreground text-sm sm:text-base font-medium">{restaurant.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Adresse</p>
                      <p className="text-foreground text-sm">{restaurant.address || 'Non renseignée'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">Type de cuisine</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.cuisine_type?.length > 0 ? (
                          restaurant.cuisine_type.map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Non défini
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {restaurant.description && (
                    <div className="pt-4 border-t">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-foreground text-sm">{restaurant.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RestaurantProfileModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        restaurant={restaurant}
        onUpdate={() => {
          loadData();
          // Force refresh after a short delay to ensure data is updated
          setTimeout(() => {
            loadData();
          }, 500);
        }}
      />
      <NewOfferModal 
        open={showOfferModal}
        onOpenChange={setShowOfferModal}
        restaurantId={restaurant?.id || null}
        onSuccess={loadData}
      />
      <MenusModal 
        open={showMenusModal}
        onOpenChange={setShowMenusModal}
        restaurantId={restaurant?.id || null}
        onSuccess={loadData}
      />
      <RestaurantFiltersModal 
        open={showFiltersModal}
        onOpenChange={setShowFiltersModal}
        onApplyFilters={(filters) => {
          console.log('Filters applied:', filters);
          // TODO: Implémenter la logique de filtrage
        }}
      />
    </div>
  );
};

export default RestaurantDashboard;