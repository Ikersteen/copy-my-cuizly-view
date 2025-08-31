import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, MapPin, ChefHat, Filter, Heart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import LoadingSpinner from "./LoadingSpinner";
import { RestaurantMenuModal } from "./RestaurantMenuModal";
import { RestaurantFiltersModal, RestaurantFilterOptions } from "./RestaurantFiltersModal";
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
  score?: number;
  reasons?: string[];
}

export const RecommendationCardsSection = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Generate short, consistent reasons for restaurant recommendations
  const generateRecommendationReasons = (restaurant: Restaurant) => {
    const reasons: string[] = [];
    const currentHour = new Date().getHours();
    const currentMealTime = getCurrentMealTime(currentHour);

    // Price range match (priority 1)
    if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
      reasons.push(t('recommendations.inYourBudget'));
    }

    // Cuisine preferences match (priority 2)
    if (preferences?.cuisine_preferences && preferences.cuisine_preferences.length > 0) {
      const matchingCuisines = restaurant.cuisine_type?.filter((cuisine: string) => 
        preferences.cuisine_preferences.includes(cuisine)
      ) || [];
      if (matchingCuisines.length > 0) {
        reasons.push(t('recommendations.cuisineMatches'));
      }
    }

    // Meal time match (priority 3)
    if (preferences?.favorite_meal_times?.includes(currentMealTime)) {
      reasons.push("Moment idéal");
    }

    // Default if no specific matches (keep it short)
    if (reasons.length === 0) {
      reasons.push("Près de vous");
    }

    // Limit to maximum 2 reasons for consistency
    return reasons.slice(0, 2);
  };

  // Helper function for meal time calculation (used in multiple places)
  const getCurrentMealTime = (hour: number): string => {
    if (hour >= 6 && hour < 11) return 'Déjeuner / Brunch';
    if (hour >= 11 && hour < 15) return 'Déjeuner rapide';
    if (hour >= 15 && hour < 17) return 'Collation';
    if (hour >= 17 && hour < 22) return 'Dîner / Souper';
    if (hour >= 22 || hour < 2) return 'Repas tardif';
    return 'Détox';
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

  const generateRecommendations = useCallback(async () => {
    console.log('🔍 Generating recommendations with preferences:', preferences);
    setLoading(true);
    
    // Clear any cached data that might contain old recommendation formats
    setRecommendedRestaurants([]);
    setRestaurantRatings({});
    
    try {
      // Try AI recommendations first
      try {
        console.log('🤖 Trying AI recommendations...');
        const { data: restaurantsResponse } = await supabase.rpc('get_public_restaurants');
        const restaurantsData = restaurantsResponse || [];

        if (restaurantsData.length > 0) {
          const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-recommendations', {
            body: {
              restaurants: restaurantsData.slice(0, 20),
              preferences: preferences,
              userId: (await supabase.auth.getUser()).data.user?.id
            }
          });

          if (!aiError && aiResult?.recommendations?.length > 0) {
            console.log('✅ AI recommendations successful');
            
            // Get real ratings for AI recommendations and clear old reason format
            const ratingsPromises = aiResult.recommendations.map(async (restaurant: any) => {
              const ratingData = await getRealRating(restaurant.id);
              setRestaurantRatings(prev => ({
                ...prev,
                [restaurant.id]: ratingData
              }));
              return {
                ...restaurant,
                // Force use of new reason format, ignore any old cached reasons
                reasons: restaurant.ai_reasons?.length > 0 ? restaurant.ai_reasons : generateRecommendationReasons(restaurant)
              };
            });

            const aiRestaurantsWithRatings = await Promise.all(ratingsPromises);
            setRecommendedRestaurants(aiRestaurantsWithRatings);
            setLoading(false);
            return;
          }
        }
      } catch (aiError) {
        console.log('🔄 AI not available, falling back to traditional scoring');
      }

      // Fallback to traditional scoring
      const { data: restaurantsResponse } = await supabase.rpc('get_public_restaurants');
      const { data: menusData } = await supabase
        .from('menus')
        .select('restaurant_id, cuisine_type, dietary_restrictions, allergens')
        .eq('is_active', true);

      const restaurantsData = restaurantsResponse || [];
      const menus = menusData || [];

      if (restaurantsData.length === 0) {
        setRecommendedRestaurants([]);
        setLoading(false);
        return;
      }

      // Score restaurants
      const scoredRestaurants = restaurantsData.map(restaurant => {
        let score = 0;
        const currentHour = new Date().getHours();
        const currentMealTime = getCurrentMealTime(currentHour);
        
        // Cuisine preferences (25%)
        if (preferences?.cuisine_preferences?.length) {
          const restaurantMenus = menus.filter(menu => menu.restaurant_id === restaurant.id);
          const cuisineMatches = restaurant.cuisine_type?.filter(cuisine =>
            preferences.cuisine_preferences.includes(cuisine)
          ) || [];
          
          const menuCuisineMatches = restaurantMenus.filter(menu =>
            preferences.cuisine_preferences.includes(menu.cuisine_type)
          );

          if (cuisineMatches.length > 0 || menuCuisineMatches.length > 0) {
            score += 25 + (cuisineMatches.length + menuCuisineMatches.length) * 5;
          }
        }

        // Meal time preference (25%)
        if (preferences?.favorite_meal_times?.includes(currentMealTime)) {
          score += 25;
        }

        // Price range (20%)
        if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
          score += 20;
        }

        // Dietary restrictions (15%)
        if (preferences?.dietary_restrictions?.length) {
          score += 15;
        }

        score += 15; // Base score

        return {
          ...restaurant,
          score,
          // Force regeneration of reasons with new format
          reasons: generateRecommendationReasons(restaurant)
        };
      });

      // Helper function for meal time calculation  
      function getCurrentMealTime(hour: number): string {
        if (hour >= 6 && hour < 11) return 'Déjeuner / Brunch';
        if (hour >= 11 && hour < 15) return 'Déjeuner rapide';
        if (hour >= 15 && hour < 17) return 'Collation';
        if (hour >= 17 && hour < 22) return 'Dîner / Souper';
        if (hour >= 22 || hour < 2) return 'Repas tardif';
        return 'Détox';
      }

      // Sort by score and take top restaurants
      const topRestaurants = scoredRestaurants
        .sort((a, b) => b.score - a.score)
        .slice(0, 7); // Limit to 7 restaurants matching user preferences

      // Load ratings for recommended restaurants
      const ratingsPromises = topRestaurants.map(async (restaurant) => {
        const ratingData = await getRealRating(restaurant.id);
        setRestaurantRatings(prev => ({
          ...prev,
          [restaurant.id]: ratingData
        }));
        return restaurant;
      });

      const finalRestaurants = await Promise.all(ratingsPromises);
      setRecommendedRestaurants(finalRestaurants);
      
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      setRecommendedRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [preferences, t]);

  const trackProfileView = async (restaurantId: string) => {
    try {
      const { error } = await supabase.rpc('track_profile_view', {
        p_restaurant_id: restaurantId
      });
      if (error) {
        console.error('Error tracking profile view:', error);
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const handleApplyFilters = (filters: RestaurantFilterOptions) => {
    console.log('Filters applied:', filters);
    generateRecommendations();
  };

  // Load recommendations when preferences change
  useEffect(() => {
    if (preferences?.id) {
      generateRecommendations();
    }
  }, [preferences?.id, generateRecommendations]);

  // Listen for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = () => {
      if (preferences?.id && !loading) {
        generateRecommendations();
      }
    };

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate);
    return () => {
      window.removeEventListener('preferencesUpdated', handlePreferencesUpdate);
    };
  }, [preferences?.id, loading, generateRecommendations]);

  if (loading) {
    return (
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
                <h2 className="text-lg font-semibold">{t('recommendations.generatingRecommendations')}</h2>
              </div>
              <p className="text-muted-foreground">{t('recommendations.analyzingPreferences')}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (recommendedRestaurants.length === 0) {
    return (
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="bg-card border rounded-2xl p-12 max-w-2xl mx-auto shadow-sm">
              <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-muted/50">
                  <ChefHat className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-4 text-center">
                  <h3 className="text-2xl font-bold whitespace-nowrap">{t('recommendations.noRecommendationsTitle')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {t('recommendations.noRecommendationsDesc')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    onClick={() => setShowFilters(true)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {t('recommendations.modifyPreferences')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateRecommendations}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('recommendations.refreshRecommendations')}
                  </Button>
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
          {recommendedRestaurants.map((restaurant) => (
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
                    <Heart className={`h-4 w-4 ${isFavorite(restaurant.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
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
                             {currentRating.rating} ({currentRating.totalRatings} {currentRating.totalRatings > 1 ? t('recommendations.evaluations') : t('recommendations.evaluation')})
                           </span>
                        </div>
                      );
                    } else {
                      return <span className="text-xs text-muted-foreground">{t('recommendations.noRatingsYet')}</span>;
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
                         className={`text-xs text-center justify-center flex items-center gap-0.5 ${
                           isPreferred
                             ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                             : 'bg-muted/50 text-muted-foreground border-muted'
                         }`}
                       >
                         {isPreferred && <span className="text-xs leading-none">★</span>}
                         <span className="leading-none">{CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}</span>
                       </Badge>
                    );
                  })}
                </div>

                {(() => {
                  const reasons = restaurant.reasons || [];
                  return reasons.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                       <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                         <Sparkles className="h-3 w-3" />
                         {t('recommendations.whyThisChoice')}
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
                    trackProfileView(restaurant.id);
                    setSelectedRestaurant(restaurant);
                    setShowRestaurantModal(true);
                  }}
                 >
                   {t('recommendations.viewProfile')}
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters button for mobile */}
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(true)}
            className="group"
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('recommendations.filters')}
          </Button>
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
};