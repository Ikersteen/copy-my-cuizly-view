import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ArrowRight, MapPin } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantMenuModal } from "./RestaurantMenuModal";
import { useTranslation } from 'react-i18next';
import { CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { getTranslatedDescription } from "@/lib/translations";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  description_fr?: string;
  description_en?: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  logo_url?: string;
}

export const SavedFavoritesSection = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { preferences } = useUserPreferences();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);


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
      
      // Clear any cached data that might contain old reason formats
      setFavoriteRestaurants([]);
      setRestaurantRatings({});
      
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
          <div className="text-center space-y-8">
            <div className="bg-card border rounded-2xl p-12 max-w-2xl mx-auto shadow-sm">
              <div className="flex flex-col items-center space-y-6">
                <div className="space-y-4 text-center">
                  <h3 className="text-2xl font-bold whitespace-nowrap">{t('favorites.noFavorites')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {t('favorites.noFavoritesDescription')}
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
                        {restaurant.price_range && (
                          <>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm font-bold text-muted-foreground">{restaurant.price_range}</span>
                          </>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 text-sm mt-1">
                        {getTranslatedDescription(restaurant, currentLanguage)}
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
                             {currentRating.rating} ({currentRating.totalRatings} {currentRating.totalRatings > 1 ? t('favorites.evaluations') : t('favorites.evaluation')})
                           </span>
                        </div>
                      );
                    } else {
                      return <span className="text-xs text-muted-foreground">{t('favorites.noRatingsYet')}</span>;
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
                        className={`text-xs text-center justify-center flex items-center gap-1 ${
                          isPreferred
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                            : 'bg-muted/50 text-muted-foreground border-muted'
                        }`}
                      >
                         {isPreferred && <span className="text-xs">★</span>}
                         <span>{CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}</span>
                      </Badge>
                    );
                  })}
                </div>


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
                   {t('favorites.viewProfile')}
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {favoriteRestaurants.length > 4 && (
          <div className="mt-8 text-center">
             <Button variant="outline" className="group">
               {t('favorites.viewAllFavorites')}
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