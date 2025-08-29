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
  dietary_restrictions?: string[];
  allergens?: string[];
  price_range: string;
  address: string;
  delivery_radius?: number;
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

  useEffect(() => {
    if (preferences) {
      generateRecommendations();
    }
  }, [preferences]);

  // Écouter les mises à jour des préférences avec plus de robustesse
  useEffect(() => {
    const handlePreferencesUpdate = (event?: CustomEvent) => {
      console.log('Preferences update event received:', event?.detail);
      console.log('Current preferences state:', preferences);
      
      // Forcer le rechargement des préférences depuis la base de données
      setTimeout(async () => {
        console.log('Regenerating recommendations after preferences update...');
        if (preferences) {
          await generateRecommendations();
        }
      }, 200);
    };

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    };
  }, [preferences]);

  // Synchronisation en temps réel des données avec debouncing
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const debouncedRegenerate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('Debounced regeneration triggered...');
        generateRecommendations();
      }, 500); // 500ms de débounce
    };

    const restaurantSubscription = supabase
      .channel('recommendations-restaurants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurants'
      }, () => {
        console.log('Restaurant data updated, scheduling regeneration...');
        debouncedRegenerate();
      })
      .subscribe();

    const menuSubscription = supabase
      .channel('recommendations-menus')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menus'
      }, () => {
        console.log('Menu data updated, scheduling regeneration...');
        debouncedRegenerate();
      })
      .subscribe();

    const ratingsSubscription = supabase
      .channel('recommendations-ratings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, async (payload: any) => {
        console.log('Rating updated, updating specific restaurant rating...');
        const restaurantId = payload.new?.restaurant_id || payload.old?.restaurant_id;
        if (restaurantId) {
          await updateRestaurantRating(restaurantId);
          debouncedRegenerate();
        }
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(restaurantSubscription);
      supabase.removeChannel(menuSubscription);
      supabase.removeChannel(ratingsSubscription);
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

      // Fetch restaurants and menus data separately for better error handling
      const [restaurantsResponse, menusResponse] = await Promise.all([
        supabase.rpc('get_public_restaurants'),
        supabase
          .from('menus')
          .select('*')
          .eq('is_active', true)
      ]);

      if (restaurantsResponse.error) {
        console.error('Error fetching restaurants:', restaurantsResponse.error);
        throw restaurantsResponse.error;
      }

      if (menusResponse.error) {
        console.error('Error fetching menus:', menusResponse.error);
        throw menusResponse.error;
      }

      const restaurantsData = restaurantsResponse.data || [];
      const menusData = menusResponse.data || [];

      console.log('Loaded restaurants:', restaurantsData.length);
      console.log('Loaded menus:', menusData.length);
      console.log('Sample menu data:', menusData[0]);

      if (restaurantsData.length === 0) {
        console.log('No restaurants found');
        setCategories([]);
        return;
      }

      const scoredRestaurants = await Promise.all(restaurantsData.map(async (restaurant) => {
        let score = 0;
        let reasons: string[] = [];
        let hasAnyMatch = false;

        // Get restaurant's menus for dietary analysis
        const restaurantMenus = menusData.filter(menu => menu.restaurant_id === restaurant.id);
        
        console.log(`Restaurant ${restaurant.name} has ${restaurantMenus.length} menus`);
        
        // Only process restaurants that have menus
        if (restaurantMenus.length === 0) {
          console.log(`Skipping ${restaurant.name} - no menus found`);
          return null;
        }
        
        // Cuisine preferences match
        if (preferences?.cuisine_preferences && preferences.cuisine_preferences.length > 0) {
          const matchingCuisines = restaurant.cuisine_type?.filter((cuisine: string) => 
            preferences.cuisine_preferences.includes(cuisine)
          ) || [];
          if (matchingCuisines.length > 0) {
            hasAnyMatch = true;
            score += matchingCuisines.length * 10;
            reasons.push(`${matchingCuisines.length} cuisine(s) favorite(s)`);
          }
        }
        
        // Price range match
        if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
          hasAnyMatch = true;
          score += 15;
          reasons.push("Dans votre budget");
        }
        
        // Dietary restrictions compatibility - check menus
        if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
          let compatibleMenusCount = 0;
          let totalMenusChecked = restaurantMenus.length;
          
          console.log(`Checking dietary restrictions for ${restaurant.name}:`, preferences.dietary_restrictions);
          
          restaurantMenus.forEach(menu => {
            console.log(`Menu "${menu.description}" dietary restrictions:`, menu.dietary_restrictions);
            const accommodatedRestrictions = preferences.dietary_restrictions.filter((restriction: string) =>
              menu.dietary_restrictions?.includes(restriction)
            );
            if (accommodatedRestrictions.length > 0) {
              compatibleMenusCount++;
              score += accommodatedRestrictions.length * 8;
              console.log(`Menu compatible! Accommodated:`, accommodatedRestrictions);
            }
          });
          
          if (compatibleMenusCount > 0) {
            hasAnyMatch = true;
            const percentage = Math.round((compatibleMenusCount / totalMenusChecked) * 100);
            reasons.push(`${percentage}% des plats compatibles`);
            console.log(`${compatibleMenusCount}/${totalMenusChecked} menus compatible for dietary restrictions`);
          }
        }
        
        // Allergen safety - exclude restaurants with menus containing user's allergens  
        if (preferences?.allergens && preferences.allergens.length > 0) {
          let hasUnsafeMenus = false;
          let safeMenusCount = 0;
          
          console.log(`Checking allergens for ${restaurant.name}:`, preferences.allergens);
          
          restaurantMenus.forEach(menu => {
            console.log(`Menu "${menu.description}" allergens:`, menu.allergens);
            const dangerousAllergens = preferences.allergens.filter((allergen: string) =>
              menu.allergens?.includes(allergen)
            );
            if (dangerousAllergens.length > 0) {
              hasUnsafeMenus = true;
              score -= dangerousAllergens.length * 10; // Reduced penalty
              console.log(`Unsafe menu found! Dangerous allergens:`, dangerousAllergens);
            } else {
              safeMenusCount++;
            }
          });
          
          // Bonus seulement si TOUS les menus sont sûrs
          if (!hasUnsafeMenus && restaurantMenus.length > 0) {
            hasAnyMatch = true;
            score += 15;
            reasons.push("Tous les plats sont sûrs");
            console.log(`All ${restaurantMenus.length} menus are safe for allergens`);
          } else if (safeMenusCount > 0) {
            const percentage = Math.round((safeMenusCount / restaurantMenus.length) * 100);
            if (percentage >= 50) {
              hasAnyMatch = true;
              reasons.push(`${percentage}% des plats sans allergènes`);
              console.log(`${safeMenusCount}/${restaurantMenus.length} menus are safe (${percentage}%)`);
            }
          }
        }

        // Final scoring and matching logic
        console.log(`Restaurant ${restaurant.name} final score: ${score}, hasAnyMatch: ${hasAnyMatch}`);
        
        // If no preferences configured, don't show recommendations
        if (!preferences || 
            (!preferences.cuisine_preferences?.length && 
             (!preferences.price_range || preferences.price_range === "") && 
             !preferences.dietary_restrictions?.length &&
             !preferences.allergens?.length)) {
          console.log('No preferences configured, excluding restaurant');
          return null;
        }

        // If restaurant has no matching criteria, exclude it  
        if (!hasAnyMatch) {
          console.log(`No matches found for ${restaurant.name}, excluding`);
          return null;
        }

        const realRating = await getRealRating(restaurant.id);
        
        const result = {
          ...restaurant,
          score,
          rating: realRating.rating,
          totalRatings: realRating.totalRatings,
          reasons
        };
        
        console.log(`Including restaurant ${restaurant.name} with score ${score} and reasons:`, reasons);
        return result;
      }));

      const validRestaurants = scoredRestaurants.filter(restaurant => restaurant !== null);
      console.log(`Final valid restaurants: ${validRestaurants.length}`);

      await loadRestaurantRatings(validRestaurants);

      const newCategories: RecommendationCategory[] = [];
      
      if (validRestaurants.length > 0) {
        const sortedRestaurants = validRestaurants.sort((a, b) => b.score - a.score);
        console.log('Top 3 restaurants by score:', sortedRestaurants.slice(0, 3).map(r => ({ name: r.name, score: r.score, reasons: r.reasons })));
        
        newCategories.push({
          id: 'recommended',
          title: 'Recommandé pour vous',
          subtitle: 'Basé sur vos préférences culinaires',
          icon: Sparkles,
          color: 'bg-gradient-to-r from-primary/10 to-primary/5',
          restaurants: sortedRestaurants.slice(0, 12)
        });
      }

      setCategories(newCategories);
      console.log(`Set ${newCategories.length} categories with ${newCategories[0]?.restaurants?.length || 0} restaurants`);

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
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold whitespace-nowrap">Génération des recommandations...</h2>
                <p className="text-xs sm:text-base text-muted-foreground">Analyse de vos préférences en cours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-muted/30 via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="bg-card border rounded-2xl p-12 max-w-2xl mx-auto shadow-sm">
              <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-muted/50">
                  <ChefHat className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Aucune recommandation disponible</h2>
                  <p className="text-muted-foreground max-w-lg">
                    Nous n'avons pas encore trouvé de restaurants qui correspondent parfaitement à vos préférences. 
                    Essayez de modifier vos critères ou explorez nos restaurants disponibles.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    onClick={() => setShowFilters(true)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Modifier mes préférences
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      setLoading(true);
                      await generateRecommendations();
                    }}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? "Actualisation..." : "Actualiser les recommandations"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
  }

  return (
    <section className="py-8 bg-gradient-to-br from-muted/30 via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="space-y-8">
            {/* En-tête de catégorie */}
            <div className={`rounded-2xl p-6 ${category.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-white/80 dark:bg-gray-800/80">
                    <category.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                      {category.title}
                    </h2>
                    <p className="text-xs sm:text-base text-muted-foreground">
                      {category.subtitle}
                    </p>
                  </div>
                </div>
                 <div className="hidden md:flex gap-2">
                   <Button variant="outline" size="sm" className="group" onClick={() => setShowFilters(true)}>
                     <Filter className="h-4 w-4 mr-0.5" />
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
                      <div className="flex flex-wrap gap-2">
                        {restaurant.cuisine_type?.map((cuisine, idx) => {
                          const isPreferred = preferences?.cuisine_preferences?.includes(cuisine);
                          return (
                            <Badge 
                              key={idx} 
                              variant={isPreferred ? "default" : "outline"}
                              className={`text-xs ${
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

             <div className="md:hidden text-center flex gap-2 justify-center flex-wrap">
               <Button variant="outline" size="sm" className="group" onClick={() => setShowFilters(true)}>
                 <Filter className="h-4 w-4 mr-0.5" />
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