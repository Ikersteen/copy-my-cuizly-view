import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { RestaurantMenuModal } from "@/components/RestaurantMenuModal";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  logo_url?: string;
}

export const SavedFavoritesSection = () => {
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { preferences } = useUserPreferences();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  // Generate reasons for why this restaurant is recommended as a favorite
  const generateFavoriteReasons = (restaurant: Restaurant) => {
    const reasons: string[] = [];

    // Cuisine preferences match
    if (preferences?.cuisine_preferences && preferences.cuisine_preferences.length > 0) {
      const matchingCuisines = restaurant.cuisine_type?.filter((cuisine: string) => 
        preferences.cuisine_preferences.includes(cuisine)
      ) || [];
      if (matchingCuisines.length > 0) {
        reasons.push(`${matchingCuisines.length} cuisine(s) favorite(s)`);
      }
    }
    
    // Price range match
    if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
      reasons.push("Dans votre budget");
    }

    // Always include favorite-specific reasons
    reasons.push("Dans vos favoris");
    if (reasons.length === 1) {
      reasons.push("Accès rapide");
    }

    return reasons;
  };

  const getRealRating = async (restaurantId: string): Promise<{ rating: number | null; totalRatings: number }> => {
    try {
      const { data } = await supabase
        .from('comments')
        .select('rating')
        .eq('restaurant_id', restaurantId)
        .not('rating', 'is', null);

      if (!data || data.length === 0) return { rating: null, totalRatings: 0 };
      
      const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return { 
        rating: Math.round(average * 10) / 10,
        totalRatings: data.length
      };
    } catch (error) {
      console.error('Error fetching rating:', error);
      return { rating: null, totalRatings: 0 };
    }
  };

  const loadRestaurantRatings = async (restaurants: Restaurant[]) => {
    const ratingsPromises = restaurants.map(async (restaurant) => {
      const ratingData = await getRealRating(restaurant.id);
      return { id: restaurant.id, ...ratingData };
    });

    const allRatings = await Promise.all(ratingsPromises);
    const ratingsMap = allRatings.reduce((acc, rating) => {
      acc[rating.id] = { rating: rating.rating, totalRatings: rating.totalRatings };
      return acc;
    }, {} as Record<string, { rating: number | null; totalRatings: number }>);

    setRestaurantRatings(ratingsMap);
  };

  useEffect(() => {
    console.log('🔄 Favorites changed:', favorites);
    if (!favLoading) {
      if (favorites.length > 0) {
        console.log('📊 Loading favorite restaurants for:', favorites);
        loadFavoriteRestaurants();
      } else {
        console.log('❌ No favorites, clearing list');
        setFavoriteRestaurants([]);
        setLoading(false);
      }
    }
  }, [favorites, favLoading]);

  // Set up real-time subscription for restaurant updates and ratings
  useEffect(() => {
    if (favorites.length === 0) return;

    const restaurantSubscription = supabase
      .channel('favorites-restaurants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurants',
        filter: `id=in.(${favorites.join(',')})`
      }, () => {
        console.log('Restaurant data updated, reloading...');
        loadFavoriteRestaurants();
      })
      .subscribe();

    const ratingsSubscription = supabase
      .channel('favorites-ratings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `restaurant_id=in.(${favorites.join(',')})`
      }, async (payload: any) => {
        console.log('Rating updated for favorite restaurant:', payload);
        const restaurantId = payload.new?.restaurant_id || payload.old?.restaurant_id;
        if (restaurantId) {
          const ratingData = await getRealRating(restaurantId);
          setRestaurantRatings(prev => ({
            ...prev,
            [restaurantId]: ratingData
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(restaurantSubscription);
      supabase.removeChannel(ratingsSubscription);
    };
  }, [favorites]);

  const loadFavoriteRestaurants = async () => {
    try {
      console.log('🔍 Loading restaurants for favorites:', favorites);
      
      // Utiliser la fonction RPC get_public_restaurants pour respecter les politiques RLS
      const { data, error } = await supabase.rpc('get_public_restaurants');
      
      if (error) throw error;
      
      // Filtrer les restaurants qui sont dans les favoris
      const favoriteRestaurantsData = data?.filter(restaurant => 
        favorites.includes(restaurant.id)
      ) || [];
      
      console.log('✅ Loaded favorite restaurants:', favoriteRestaurantsData);
      setFavoriteRestaurants(favoriteRestaurantsData);
      
      // Charger les évaluations pour ces restaurants
      if (favoriteRestaurantsData.length > 0) {
        await loadRestaurantRatings(favoriteRestaurantsData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (restaurantId: string) => {
    try {
      console.log(`Tracking profile view for restaurant ${restaurantId}`);
      
      // Utiliser la fonction database sécurisée
      const { error } = await supabase.rpc('track_profile_view', {
        p_restaurant_id: restaurantId
      });

      if (error) {
        console.error('Error tracking profile view:', error);
      } else {
        console.log('Profile view tracked successfully');
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  if (loading || favLoading) {
    return (
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (favoriteRestaurants.length === 0) {
    return (
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <h1 className="text-2xl font-bold mb-1">Vos restaurants favoris</h1>
               <p className="text-xs sm:text-sm text-muted-foreground">
                 Découvrez et retrouvez facilement vos restaurants préférés
               </p>
            </div>
          </div>
          <div className="text-center space-y-8">
            <div className="bg-card border rounded-2xl p-12 max-w-2xl mx-auto shadow-sm">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl"></div>
                  <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-full">
                    <Heart className="h-16 w-16 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-4 text-center">
                  <h3 className="text-2xl font-bold">Aucun favori pour l'instant</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    Découvrez nos restaurants et ajoutez vos préférés à votre liste de favoris en cliquant sur le cœur ❤️
                  </p>
                </div>
              </div>
            </div>

            {/* Pourquoi ce choix ? Section */}
            <div className="bg-card border rounded-xl p-8 max-w-4xl mx-auto">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Pourquoi ce choix ?</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Liste personnalisée</span>
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Vos favoris vous permettent de retrouver rapidement les restaurants que vous aimez. 
                    Une fois ajoutés, ils apparaîtront ici pour un accès facile.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Suivi personnalisé</span>
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Nous gardons en mémoire vos restaurants favoris et vous notifions 
                    des nouvelles offres et des nouveaux plats disponibles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <h1 className="text-2xl font-bold mb-1">Vos restaurants favoris</h1>
             <p className="text-xs sm:text-sm text-muted-foreground">
               Découvrez et retrouvez facilement vos restaurants préférés
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteRestaurants.slice(0, 4).map((restaurant) => (
            <Card 
              key={restaurant.id}
              className="group cursor-pointer border-0 shadow-md bg-gradient-to-br from-card to-card/80"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {restaurant.logo_url ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                        <img 
                          src={restaurant.logo_url} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                        <span className="text-primary font-semibold text-lg">
                          {restaurant.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {restaurant.name}
                      </CardTitle>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Montreal</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm font-bold text-muted-foreground">$$</span>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm mt-1">
                        {restaurant.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(restaurant.id);
                    }}
                    className="transition-colors hover:bg-red-50"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  </Button>
                </div>

                <div className="flex items-center text-sm pt-2">
                  {(() => {
                    const currentRating = restaurantRatings[restaurant.id];
                    const hasRating = currentRating && currentRating.totalRatings > 0 && currentRating.rating !== null && currentRating.rating > 0;
                    
                    if (hasRating) {
                      return (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-xs">
                            {currentRating.rating} ({currentRating.totalRatings} évaluation{currentRating.totalRatings > 1 ? 's' : ''})
                          </span>
                        </div>
                      );
                    } else {
                      return <span className="text-xs text-muted-foreground">Pas encore d'évaluations</span>;
                    }
                  })()}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {restaurant.cuisine_type?.map((cuisine, idx) => {
                    const isPreferred = preferences?.cuisine_preferences?.includes(cuisine);
                    return (
                      <Badge 
                        key={idx} 
                        variant={isPreferred ? "default" : "outline"}
                        className={`text-xs text-center justify-center ${
                          isPreferred
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                            : 'bg-muted/50 text-muted-foreground border-muted'
                        }`}
                      >
                        {isPreferred && "★ "}{cuisine}
                      </Badge>
                    );
                  })}
                </div>

                {(() => {
                  const reasons = generateFavoriteReasons(restaurant);
                  return reasons.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Pourquoi ce choix ?
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {reasons.slice(0, 2).map((reason, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs bg-background/80"
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                  size="sm"
                  onClick={() => {
                    // Track profile view
                    trackProfileView(restaurant.id);
                    setSelectedRestaurant(restaurant);
                    setShowRestaurantModal(true);
                  }}
                >
                  Voir le profil
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {favoriteRestaurants.length > 4 && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="group">
              Voir tous mes favoris
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
      
      <RestaurantMenuModal 
        open={showRestaurantModal}
        onOpenChange={setShowRestaurantModal}
        restaurant={selectedRestaurant}
      />
    </section>
  );
};