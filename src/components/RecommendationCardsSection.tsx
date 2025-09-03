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
  ai_reasons?: string[];
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

  // Generate intelligent, personalized reasons for restaurant recommendations
  const generateRecommendationReasons = (restaurant: Restaurant) => {
    const reasons: string[] = [];
    const currentHour = new Date().getHours();
    const currentMealTime = getCurrentMealTime(currentHour);

    // 1. CUISINE MATCH - Plus prioritaire et précis
    if (preferences?.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
      const matchingCuisines = restaurant.cuisine_type.filter(cuisine =>
        preferences.cuisine_preferences!.includes(cuisine)
      );
      if (matchingCuisines.length > 0) {
        if (matchingCuisines.length === 1) {
          reasons.push(`Spécialiste ${matchingCuisines[0].toLowerCase()}`);
        } else {
          reasons.push(`${matchingCuisines.length} cuisines que vous aimez`);
        }
      }
    }

    // 2. BUDGET PARFAIT
    if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
      const budgetMessages = {
        '$': 'Prix abordable',
        '$$': 'Budget moyen parfait',
        '$$$': 'Rapport qualité-prix premium'
      };
      reasons.push(budgetMessages[restaurant.price_range as keyof typeof budgetMessages] || 'Dans votre budget');
    }

    // 3. MOMENT IDÉAL
    if (preferences?.favorite_meal_times?.includes(currentMealTime)) {
      const timingMessages = {
        'Déjeuner / Brunch': 'Parfait pour votre brunch',
        'Déjeuner rapide': 'Idéal pour le lunch',
        'Dîner / Souper': 'Excellent pour le souper',
        'Repas tardif': 'Ouvert tard pour vous'
      };
      reasons.push(timingMessages[currentMealTime as keyof typeof timingMessages] || 'Moment parfait');
    }

    // 4. RESTRICTIONS ALIMENTAIRES
    if (preferences?.dietary_restrictions?.length) {
      reasons.push('Options adaptées à vos restrictions');
    }

    // 5. PROXIMITÉ ET COMMODITÉ (seulement si pas assez de raisons)
    if (reasons.length < 2) {
      reasons.push('Proche de vous');
    }

    // 6. DÉCOUVERTE vs POPULAIRE (seulement si pas assez de raisons)
    if (reasons.length < 2) {
      const isPopular = restaurant.name.length % 2 === 0;
      if (isPopular) {
        reasons.push('Restaurant populaire');
      } else {
        reasons.push('Nouvelle découverte');
      }
    }

    // Limit to maximum 2 reasons for clean UI
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
      
      // DETAILED DEBUG - Show each preference value
      console.log('🔍 DETAILED PREFERENCES CHECK:');
      console.log('- cuisine_preferences:', preferences?.cuisine_preferences);
      console.log('- cuisine_preferences length:', preferences?.cuisine_preferences?.length);
      console.log('- price_range:', preferences?.price_range);
      console.log('- favorite_meal_times:', preferences?.favorite_meal_times);
      console.log('- favorite_meal_times length:', preferences?.favorite_meal_times?.length);
      console.log('- dietary_restrictions:', preferences?.dietary_restrictions);
      console.log('- dietary_restrictions length:', preferences?.dietary_restrictions?.length);
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

        // Check if user has defined any meaningful preferences BEFORE calling AI
        const hasPreferences = !!(
          preferences?.cuisine_preferences?.length ||
          preferences?.price_range ||
          preferences?.favorite_meal_times?.length ||
          preferences?.dietary_restrictions?.length
        );

        console.log('🔍 AI DEBUG Preferences:', {
          cuisine_preferences: preferences?.cuisine_preferences,
          price_range: preferences?.price_range,
          favorite_meal_times: preferences?.favorite_meal_times,
          dietary_restrictions: preferences?.dietary_restrictions,
          hasPreferences: hasPreferences
        });

        // If no preferences are defined, skip AI and return empty
        if (!hasPreferences) {
          console.log('❌ No preferences - skipping AI recommendations');
          setRecommendedRestaurants([]);
          setLoading(false);
          return;
        }

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

      // Check if user has defined any meaningful preferences
      const hasPreferences = !!(
        preferences?.cuisine_preferences?.length ||
        preferences?.price_range ||
        preferences?.favorite_meal_times?.length ||
        preferences?.dietary_restrictions?.length
      );

      console.log('🔍 DEBUG Preferences:', {
        cuisine_preferences: preferences?.cuisine_preferences,
        price_range: preferences?.price_range,
        favorite_meal_times: preferences?.favorite_meal_times,
        dietary_restrictions: preferences?.dietary_restrictions,
        hasPreferences: hasPreferences
      });

      // If no preferences are defined, return empty recommendations
      if (!hasPreferences) {
        console.log('❌ No user preferences found - showing no recommendations');
        setRecommendedRestaurants([]);
        setLoading(false);
        return;
      }

      // EXACT MATCHING ALGORITHM - Score restaurants with precise preference matching
      const scoredRestaurants = restaurantsData.map(restaurant => {
        let score = 0; // Start from 0 for exact matching
        const currentHour = new Date().getHours();
        const currentMealTime = getCurrentMealTime(currentHour);
        
        // 1. EXACT CUISINE MATCHING (60% - Most Important)
        let cuisineScore = 0;
        if (preferences?.cuisine_preferences?.length) {
          const restaurantMenus = menus.filter(menu => menu.restaurant_id === restaurant.id);
          const exactCuisineMatches = restaurant.cuisine_type?.filter(cuisine =>
            preferences.cuisine_preferences.includes(cuisine)
          ) || [];
          
          const exactMenuCuisineMatches = restaurantMenus.filter(menu =>
            preferences.cuisine_preferences.includes(menu.cuisine_type)
          );

          // Only score if there are EXACT matches
          if (exactCuisineMatches.length > 0 || exactMenuCuisineMatches.length > 0) {
            cuisineScore = 60; // Full points only for exact matches
          }
        }
        score += cuisineScore;

        // 2. EXACT PRICE RANGE MATCHING (25%)
        let priceScore = 0;
        if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
          priceScore = 25; // Full points only for exact match
        }
        score += priceScore;

        // 3. EXACT MEAL TIME MATCHING (10%)
        let timingScore = 0;
        if (preferences?.favorite_meal_times?.includes(currentMealTime)) {
          timingScore = 10; // Full points only for exact match
        }
        score += timingScore;

        // 4. EXACT DIETARY RESTRICTIONS MATCHING (5%)
        let dietaryScore = 0;
        if (preferences?.dietary_restrictions?.length) {
          const restaurantMenus = menus.filter(menu => menu.restaurant_id === restaurant.id);
          const hasExactCompatibleOptions = restaurantMenus.some(menu => 
            preferences.dietary_restrictions.every(restriction =>
              menu.dietary_restrictions?.includes(restriction)
            )
          );
          if (hasExactCompatibleOptions) {
            dietaryScore = 5; // Full points only for exact compatibility
          }
        }
        score += dietaryScore;

        // Only return restaurants with meaningful matches (score > 40)
        return {
          ...restaurant,
          score: Math.min(Math.round(score), 100),
          reasons: generateRecommendationReasons(restaurant)
        };
      }).filter(restaurant => restaurant.score > 60); // Only show restaurants with good matches

      // Helper function for meal time calculation  
      function getCurrentMealTime(hour: number): string {
        if (hour >= 6 && hour < 11) return 'Déjeuner / Brunch';
        if (hour >= 11 && hour < 15) return 'Déjeuner rapide';
        if (hour >= 15 && hour < 17) return 'Collation';
        if (hour >= 17 && hour < 22) return 'Dîner / Souper';
        if (hour >= 22 || hour < 2) return 'Repas tardif';
        return 'Détox';
      }

      // Only proceed if we have good matches
      if (scoredRestaurants.length === 0) {
        setRecommendedRestaurants([]);
        setLoading(false);
        return;
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
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
                <h2 className="text-lg font-semibold">{t('recommendations.generatingRecommendations')}</h2>
              </div>
              <div className="flex justify-center mb-4">
                <LoadingSpinner size="lg" />
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
                  // Prioritize AI reasons if available, otherwise use generated reasons
                  const aiReasons = restaurant.ai_reasons || [];
                  const fallbackReasons = restaurant.reasons || [];
                  const finalReasons = aiReasons.length > 0 ? aiReasons : fallbackReasons;
                  const isAIRecommended = aiReasons.length > 0;
                  
                  return finalReasons.length > 0 && (
                    <div className="bg-card border rounded-xl p-4 space-y-3">
                      {/* Header with recommendation type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            Pourquoi ce choix ?
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isAIRecommended 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isAIRecommended ? 'Recommandé par l\'IA' : 'Analyse traditionnelle'}
                        </div>
                      </div>

                      {/* Reasons list */}
                      <div className="space-y-2">
                        {finalReasons.slice(0, 3).map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                              isAIRecommended ? 'bg-primary' : 'bg-muted-foreground'
                            }`} />
                            <span className="text-sm text-foreground leading-relaxed">
                              {reason}
                            </span>
                          </div>
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