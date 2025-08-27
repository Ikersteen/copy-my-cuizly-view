import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Clock, Star, MapPin, ChefHat, ArrowRight, Filter, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { RestaurantMenuModal } from "@/components/RestaurantMenuModal";
import { RestaurantFiltersModal, RestaurantFilterOptions } from "@/components/RestaurantFiltersModal";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  logo_url?: string;
  score?: number;
  reasons?: string[];
  rating?: number;
  totalRatings?: number;
  delivery_time?: string;
}

interface RecommendationCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  restaurants: Restaurant[];
  color: string;
}

export const PersonalizedRecommendations = () => {
  const { preferences } = useUserPreferences();
  const [categories, setCategories] = useState<RecommendationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});

  const getRealRating = async (restaurantId: string): Promise<{ rating: number | null; totalRatings: number }> => {
    try {
      const { data } = await supabase
        .from('ratings')
        .select('rating')
        .eq('restaurant_id', restaurantId);

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

  const updateRestaurantRating = async (restaurantId: string) => {
    const ratingData = await getRealRating(restaurantId);
    setRestaurantRatings(prev => ({
      ...prev,
      [restaurantId]: ratingData
    }));
  };

  const handleApplyFilters = (filters: RestaurantFilterOptions) => {
    console.log('Filters applied:', filters);
  };

  useEffect(() => {
    if (preferences) {
      generateRecommendations();
    }
  }, [preferences]);

  useEffect(() => {
    const ratingsChannel = supabase
      .channel('all-ratings-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings',
        },
        async (payload: any) => {
          const restaurantId = payload.new?.restaurant_id || payload.old?.restaurant_id;
          if (restaurantId) {
            await updateRestaurantRating(restaurantId);
            setTimeout(() => {
              generateRecommendations();
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      ratingsChannel.unsubscribe();
    };
  }, []);

  const loadRestaurantRatings = async (restaurants: any[]) => {
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

  const generateRecommendations = async () => {
    try {
      setLoading(true);

      const { data: restaurants, error } = await supabase
        .rpc('get_public_restaurants');

      if (error) throw error;

      if (!restaurants) {
        setCategories([]);
        return;
      }

      const scoredRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
        let score = 0;
        let reasons: string[] = [];

        if (preferences?.cuisine_preferences?.length) {
          const cuisineMatch = restaurant.cuisine_type?.some(cuisine =>
            preferences.cuisine_preferences.includes(cuisine)
          );
          if (cuisineMatch) {
            score += 50;
            const matchedCuisine = restaurant.cuisine_type?.find(cuisine =>
              preferences.cuisine_preferences.includes(cuisine)
            );
            if (matchedCuisine) {
              reasons.push(`Cuisine ${matchedCuisine.toLowerCase()}`);
            }
          }
        }

        if (preferences?.price_range === restaurant.price_range) {
          score += 30;
          reasons.push("Dans votre budget");
        }

        const realRating = await getRealRating(restaurant.id);
        
        return {
          ...restaurant,
          score,
          rating: realRating.rating,
          totalRatings: realRating.totalRatings,
          reasons
        };
      }));

      await loadRestaurantRatings(scoredRestaurants);

      const newCategories: RecommendationCategory[] = [
        {
          id: 'recommended',
          title: 'Recommandé pour vous',
          subtitle: 'Basé sur vos préférences culinaires',
          icon: Sparkles,
          color: 'bg-gradient-to-r from-primary/10 to-primary/5',
          restaurants: scoredRestaurants
            .sort((a, b) => b.score - a.score)
            .slice(0, 12)
        }
      ];

      const filteredCategories = newCategories.filter(cat => cat.restaurants.length > 0);
      setCategories(filteredCategories);

    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <div className="flex items-center space-x-2 mt-4">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h2 className="text-xl font-semibold">Génération des recommandations...</h2>
            </div>
            <p className="text-muted-foreground mt-2">Analyse de vos préférences en cours</p>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gradient-to-br from-muted/30 via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="space-y-8">
            {/* En-tête de catégorie */}
            <div className={`rounded-2xl p-6 ${category.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                        {category.title}
                      </h2>
                      <span className="hidden sm:inline text-muted-foreground">•</span>
                      <p className="text-xs sm:text-base text-muted-foreground">
                        {category.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                 <div className="hidden md:flex gap-2">
                   <Button variant="outline" size="sm" className="group" onClick={() => setShowFilters(true)}>
                     <Filter className="h-4 w-4 mr-2" />
                     Filtres
                   </Button>
                 </div>
              </div>
            </div>

            {/* Grille de restaurants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.restaurants.map((restaurant) => (
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
                            <ChefHat className="h-6 w-6 text-primary" />
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
                              {restaurant.description}
                            </CardDescription>
                          </div>
                      </div>
                    </div>

            <div className="flex items-center text-sm pt-2">
              {(() => {
                const currentRating = restaurantRatings[restaurant.id];
                if (currentRating?.totalRatings > 0 && currentRating?.rating && currentRating.rating > 0) {
                  return (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-xs">
                        {currentRating.rating} ({currentRating.totalRatings} évaluations)
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
                     <div className="flex flex-wrap gap-2">
                       {restaurant.cuisine_type?.slice(0, 3).map((cuisine, idx) => (
                         <Badge 
                           key={idx} 
                           variant="outline" 
                           className={`text-xs ${
                             preferences?.cuisine_preferences?.includes(cuisine)
                               ? 'bg-primary/10 text-primary border-primary/30'
                               : ''
                           }`}
                         >
                           {cuisine}
                         </Badge>
                       ))}
                     </div>

                     {restaurant.reasons && restaurant.reasons.length > 0 && (
                       <div className="bg-muted/50 rounded-lg p-3">
                         <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                           <Sparkles className="h-3 w-3" />
                           Pourquoi ce choix ?
                         </p>
                         <div className="flex flex-wrap gap-1">
                           {restaurant.reasons.slice(0, 2).map((reason, idx) => (
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
                     )}


                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                      size="sm"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowRestaurantModal(true);
                      }}
                    >
                      Voir le menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

             <div className="md:hidden text-center flex gap-2 justify-center flex-wrap">
               <Button variant="outline" size="sm" className="group" onClick={() => setShowFilters(true)}>
                 <Filter className="h-4 w-4 mr-2" />
                 Filtres
               </Button>
             </div>
          </div>
        ))}
      </div>

       <RestaurantMenuModal 
         open={showRestaurantModal}
         onOpenChange={setShowRestaurantModal}
         restaurant={selectedRestaurant}
       />
       
       <RestaurantFiltersModal 
         open={showFilters}
         onOpenChange={setShowFilters}
         onApplyFilters={handleApplyFilters}
       />
    </section>
  );
};