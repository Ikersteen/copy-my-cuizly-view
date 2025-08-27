import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ArrowRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useRatings } from "@/hooks/useRatings";

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
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { averageRating: number; totalRatings: number }>>({});

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

  // Load ratings for favorite restaurants
  useEffect(() => {
    const loadRatings = async () => {
      if (favoriteRestaurants.length === 0) return;
      
      const ratingsData: Record<string, { averageRating: number; totalRatings: number }> = {};
      
      for (const restaurant of favoriteRestaurants) {
        try {
          const { data } = await supabase
            .from('ratings')
            .select('rating')
            .eq('restaurant_id', restaurant.id);

          if (data && data.length > 0) {
            const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
            ratingsData[restaurant.id] = {
              averageRating: Math.round(average * 10) / 10,
              totalRatings: data.length
            };
          } else {
            ratingsData[restaurant.id] = {
              averageRating: 0,
              totalRatings: 0
            };
          }
        } catch (error) {
          console.error('Error fetching ratings for', restaurant.id, error);
          ratingsData[restaurant.id] = {
            averageRating: 0,
            totalRatings: 0
          };
        }
      }
      
      setRestaurantRatings(ratingsData);
    };

    loadRatings();
  }, [favoriteRestaurants]);

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
        table: 'ratings',
        filter: `restaurant_id=in.(${favorites.join(',')})`
      }, async () => {
        console.log('Rating updated for favorite restaurant');
        // Reload all ratings when any rating changes
        const ratingsData: Record<string, { averageRating: number; totalRatings: number }> = {};
        
        for (const restaurant of favoriteRestaurants) {
          try {
            const { data } = await supabase
              .from('ratings')
              .select('rating')
              .eq('restaurant_id', restaurant.id);

            if (data && data.length > 0) {
              const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
              ratingsData[restaurant.id] = {
                averageRating: Math.round(average * 10) / 10,
                totalRatings: data.length
              };
            } else {
              ratingsData[restaurant.id] = {
                averageRating: 0,
                totalRatings: 0
              };
            }
          } catch (error) {
            console.error('Error fetching ratings for', restaurant.id, error);
          }
        }
        
        setRestaurantRatings(ratingsData);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(restaurantSubscription);
      supabase.removeChannel(ratingsSubscription);
    };
  }, [favorites, favoriteRestaurants]);

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
    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
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
            <div className="bg-muted/30 rounded-lg p-12 max-w-lg mx-auto">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <p className="text-lg text-muted-foreground mb-3">
                Votre liste de favoris est vide pour l'instant.
              </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteRestaurants.slice(0, 4).map((restaurant) => (
            <Card 
              key={restaurant.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:shadow-xl"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {restaurant.logo_url ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden mb-3">
                        <img 
                          src={restaurant.logo_url} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <span className="text-primary font-semibold text-lg">
                          {restaurant.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {restaurant.description}
                    </CardDescription>
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
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const currentRating = restaurantRatings[restaurant.id];
                      const hasRating = currentRating && currentRating.totalRatings > 0 && currentRating.averageRating > 0;
                      
                      if (hasRating) {
                        return (
                          <>
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            <span>{currentRating.averageRating}</span>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <Star className="h-4 w-4 text-gray-300" />
                            <span>Pas encore d'évaluations</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs font-bold">Montréal • $$</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {restaurant.cuisine_type?.map((cuisine, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cuisine}
                    </Badge>
                  ))}
                </div>

                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  size="sm"
                >
                  Voir le menu
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
    </section>
  );
};