import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, MapPin, ChefHat, Filter, Heart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import LoadingSpinner from "./LoadingSpinner";
import { RestaurantFiltersModal, RestaurantFilterOptions } from "./RestaurantFiltersModal";
import { useTranslation } from 'react-i18next';
import { CUISINE_TRANSLATIONS, CUISINE_OPTIONS } from "@/constants/cuisineTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { getTranslatedDescription } from "@/lib/translations";
import { useNavigate } from "react-router-dom";
import { formatRestaurantAddress } from "@/lib/addressUtils";

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
  reasons?: (string | { text: string; type: string })[];
}

export const RecommendationCardsSection = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Generate detailed, explanatory reasons for restaurant recommendations
  // Following strict priority order: Dietary restrictions, Allergens, Cuisines, Price, Timing, Location, Address
  const generateRecommendationReasons = (restaurant: Restaurant, menus: any[] = []) => {
    const reasons: { text: string; type: string }[] = [];
    const currentHour = new Date().getHours();
    const currentMealTime = getCurrentMealTime(currentHour);

    // 1. DIETARY RESTRICTIONS - Highest priority (only if user has defined them)
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      // Note: We check dietary restrictions match based on user preferences and context
      // The actual compatibility is handled by the filtering in generateRecommendations
      const translationKey = preferences.dietary_restrictions.length === 1 ? 'reasonDietaryRestrictionFound' : 'reasonDietaryRestrictionsFound';
      reasons.push({
        text: t(`recommendations.${translationKey}`),
        type: 'dietary'
      });
    }

    // 2. ALLERGENS - Safety priority (only if user has defined allergens to avoid)
    if (preferences?.allergens && preferences.allergens.length > 0) {
      const restaurantMenus = menus.filter((menu: any) => menu.restaurant_id === restaurant.id);
      const identifiedAllergens = restaurantMenus.reduce((allergens: string[], menu: any) => {
        const menuAllergens = menu.allergens?.filter((allergen: string) => preferences.allergens.includes(allergen)) || [];
        return [...allergens, ...menuAllergens];
      }, []);
      const uniqueAllergens = [...new Set(identifiedAllergens)];
      
      if (uniqueAllergens.length > 0) {
        const translationKey = uniqueAllergens.length === 1 ? 'reasonAllergenIdentified' : 'reasonAllergensIdentified';
        reasons.push({
          text: t(`recommendations.${translationKey}`),
          type: 'allergens'
        });
      }
    }

    // 3. CUISINES - Keep current explanation (only if user has defined cuisine preferences)
    if (preferences?.cuisine_preferences && preferences.cuisine_preferences.length > 0) {
      const matchingCuisines = restaurant.cuisine_type?.filter((cuisine: string) => 
        preferences.cuisine_preferences.includes(cuisine)
      ) || [];
      if (matchingCuisines.length > 0) {
        reasons.push({
          text: t('recommendations.reasonCuisineFavorite'),
          type: 'cuisine'
        });
      }
    }

    // 4. PRICE RANGE - Only if user has defined a specific price preference
    if (preferences?.price_range && preferences.price_range !== '$' && restaurant.price_range === preferences.price_range) {
      reasons.push({
        text: t('recommendations.reasonPriceIdeal') + ` (${preferences.price_range})`,
        type: 'price'
      });
    }

    // 5. MEAL TIMING - Only if user has defined favorite meal times
    if (preferences?.favorite_meal_times && preferences.favorite_meal_times.length > 0 && preferences.favorite_meal_times.includes(currentMealTime)) {
      reasons.push({
        text: t('recommendations.reasonPerfectTiming'),
        type: 'timing'
      });
    }

    // 6. DELIVERY RADIUS - Only if user has defined a specific radius
    if (preferences?.delivery_radius && preferences.delivery_radius > 1) {
      reasons.push({
        text: t('recommendations.reasonWithinRadius') + ` (${preferences.delivery_radius} km)`,
        type: 'location'
      });
    }

    // 7. ADDRESS/NEIGHBORHOOD - Only if user has defined an address
    if (preferences?.neighborhood && restaurant.address?.toLowerCase().includes(preferences.neighborhood.toLowerCase())) {
      reasons.push({
        text: t('recommendations.reasonNearAddress'),
        type: 'address'
      });
    }

    // Default reason if no specific preferences match or are defined
    if (reasons.length === 0) {
      reasons.push({
        text: t('recommendations.reasonNewDiscovery'),
        type: 'default'
      });
    }

    // Limit to maximum 2 reasons for consistency
    return reasons.slice(0, 2);
  };

  // Helper function for meal time calculation (used in multiple places)
  const getCurrentMealTime = (hour: number): string => {
    if (hour >= 6 && hour < 11) return t('mealTimes.breakfast');
    if (hour >= 11 && hour < 15) return t('mealTimes.lunch');
    if (hour >= 15 && hour < 17) return t('mealTimes.snack');
    if (hour >= 17 && hour < 22) return t('mealTimes.dinner');
    if (hour >= 22 || hour < 2) return t('mealTimes.lateNight');
    return t('mealTimes.detox');
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
          (preferences?.price_range && preferences?.price_range !== '$') ||
          preferences?.favorite_meal_times?.length ||
          preferences?.dietary_restrictions?.length ||
          preferences?.allergens?.length
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
          // Get menus data for reason generation
          const { data: menusData } = await supabase
            .from('menus')
            .select('restaurant_id, cuisine_type, dietary_restrictions, allergens')
            .eq('is_active', true);

          const menus = menusData || [];

          const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-recommendations', {
            body: {
              restaurants: restaurantsData.slice(0, 20),
              preferences: preferences,
              userId: (await supabase.auth.getUser()).data.user?.id
            }
          });

          if (!aiError && aiResult?.recommendations?.length > 0) {
            console.log('✅ AI recommendations successful - restaurants passed security filtering');
            
            // Get real ratings for AI recommendations and clear old reason format
            const ratingsPromises = aiResult.recommendations.map(async (restaurant: any) => {
              const ratingData = await getRealRating(restaurant.id);
              setRestaurantRatings(prev => ({
                ...prev,
                [restaurant.id]: ratingData
              }));
              return {
                ...restaurant,
                // Force use of new reason format with menus data for allergen detection
                reasons: restaurant.ai_reasons?.length > 0 ? restaurant.ai_reasons : generateRecommendationReasons(restaurant, menus)
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
        preferences?.dietary_restrictions?.length ||
        preferences?.allergens?.length
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

      // 🔒 ÉTAPE 1: FILTRAGE DE SÉCURITÉ STRICT (avant scoring)
      const safeRestaurants = restaurantsData.filter(restaurant => {
        // ❌ EXCLUSION ALLERGÈNES: Restaurant contient allergènes dangereux
        if (preferences?.allergens?.length) {
          const restaurantMenus = menus.filter(menu => menu.restaurant_id === restaurant.id);
          const hasConflictingAllergens = restaurantMenus.some(menu =>
            menu.allergens?.some((allergen: string) => preferences.allergens.includes(allergen))
          ) || restaurant.allergens?.some((allergen: string) => preferences.allergens.includes(allergen));
          
          if (hasConflictingAllergens) {
            console.log(`🚫 EXCLUSION: ${restaurant.name} - allergènes dangereux détectés`);
            return false; // EXCLUSION TOTALE
          }
        }
        
        // ❌ EXCLUSION RESTRICTIONS: Restaurant ne supporte pas les restrictions
        if (preferences?.dietary_restrictions?.length) {
          const restaurantMenus = menus.filter(menu => menu.restaurant_id === restaurant.id);
          const hasCompatibleOptions = restaurantMenus.some(menu =>
            preferences.dietary_restrictions.some(restriction =>
              menu.dietary_restrictions?.includes(restriction)
            )
          ) || restaurant.dietary_restrictions?.some(restriction =>
            preferences.dietary_restrictions.includes(restriction)
          );
          
          if (!hasCompatibleOptions) {
            console.log(`🚫 EXCLUSION: ${restaurant.name} - restrictions non supportées`);
            return false; // EXCLUSION TOTALE
          }
        }
        
        console.log(`✅ SÉCURITAIRE: ${restaurant.name} passe le filtrage de sécurité`);
        return true; // Restaurant sécuritaire
      });

      console.log(`🔒 FILTRAGE SÉCURITÉ: ${restaurantsData.length} → ${safeRestaurants.length} restaurants sécuritaires`);

      if (safeRestaurants.length === 0) {
        console.log('❌ Aucun restaurant sécuritaire après filtrage strict');
        setRecommendedRestaurants([]);
        setLoading(false);
        return;
      }

      // 🎯 ÉTAPE 2: SCORING SOUPLE (préférences utilisateur)
      const scoredRestaurants = safeRestaurants.map(restaurant => {
        let score = 20; // Base score pour restaurants sécuritaires
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

        // 3. EXACT MEAL TIME / SERVICE TYPE MATCHING (10%)
        let timingScore = 0;
        
        // Check if user has meal time preferences and restaurant has service types
        if (preferences?.favorite_meal_times?.length > 0) {
          const restaurantServiceTypes = (restaurant as any).service_types || [];
          
          if (restaurantServiceTypes.length > 0) {
            // Map meal times to service types for matching
            const mealTimeToServiceMap: { [key: string]: string } = {
              'breakfast': 'breakfast_brunch',
              'lunch': 'quick_lunch', 
              'dinner': 'dinner_supper',
              'late_night': 'late_night'
            };
            
            const matchingServices = preferences.favorite_meal_times.filter(mealTime => {
              const serviceType = mealTimeToServiceMap[mealTime];
              return serviceType && restaurantServiceTypes.includes(serviceType);
            });
            
            if (matchingServices.length > 0) {
              timingScore = (matchingServices.length / preferences.favorite_meal_times.length) * 10;
            }
          } else {
            // Fallback: check current meal time if no service types defined
            if (preferences.favorite_meal_times.includes(currentMealTime)) {
              timingScore = 10;
            }
          }
        } else {
          // Fallback: current meal time matching
          if (preferences?.favorite_meal_times?.includes(currentMealTime)) {
            timingScore = 10;
          }
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

        console.log(`🎯 SCORING: ${restaurant.name} = ${score} points`);
        
        return {
          ...restaurant,
          score: Math.min(Math.round(score), 120), // Score maximum de 120 points
          reasons: generateRecommendationReasons(restaurant, menus)
        };
      }).filter(restaurant => restaurant.score >= 40); // Restaurants avec score minimum

      // Helper function for meal time calculation  
      function getCurrentMealTime(hour: number): string {
        if (hour >= 6 && hour < 11) return t('mealTimes.breakfast');
        if (hour >= 11 && hour < 15) return t('mealTimes.lunch');
        if (hour >= 15 && hour < 17) return t('mealTimes.snack');
        if (hour >= 17 && hour < 22) return t('mealTimes.dinner');
        if (hour >= 22 || hour < 2) return t('mealTimes.lateNight');
        return t('mealTimes.detox');
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

  // Listen for preference updates + SYSTÈME REAL-TIME COMPLET
  useEffect(() => {
    console.log('🚀 Initialisation du système real-time pour les recommandations');
    
    const handlePreferencesUpdate = () => {
      if (preferences?.id && !loading) {
        console.log('🔄 Global preferences update event received');
        generateRecommendations();
      }
    };

    // 1. Real-time: Nouveaux restaurants
    const restaurantsChannel = supabase
      .channel('restaurants-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'restaurants'
      }, (payload) => {
        console.log('🏪 Restaurant data changed:', payload);
        if (preferences?.id && !loading) {
          generateRecommendations();
        }
      })
      .subscribe();

    // 2. Real-time: Changements de menus
    const menusChannel = supabase
      .channel('menus-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menus'
      }, (payload) => {
        console.log('🍽️ Menu data changed:', payload);
        if (preferences?.id && !loading) {
          generateRecommendations();
        }
      })
      .subscribe();

    // 3. Real-time: Nouvelles offres
    const offersChannel = supabase
      .channel('offers-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'offers'
      }, (payload) => {
        console.log('🎯 Offer data changed:', payload);
        if (preferences?.id && !loading) {
          generateRecommendations();
        }
      })
      .subscribe();

    // 4. Real-time: Nouveaux commentaires/évaluations
    const commentsChannel = supabase
      .channel('comments-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, (payload) => {
        console.log('💬 Comment/Rating data changed:', payload);
        // Mettre à jour les évaluations spécifiques
        if (payload.new && typeof payload.new === 'object' && 'restaurant_id' in payload.new && payload.new.restaurant_id) {
          const restaurantId = payload.new.restaurant_id as string;
          getRealRating(restaurantId).then(ratingData => {
            setRestaurantRatings(prev => ({
              ...prev,
              [restaurantId]: ratingData
            }));
          });
        }
      })
      .subscribe();

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate);

    return () => {
      console.log('🛑 Nettoyage des souscriptions real-time');
      window.removeEventListener('preferencesUpdated', handlePreferencesUpdate);
      supabase.removeChannel(restaurantsChannel);
      supabase.removeChannel(menusChannel);
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [preferences?.id, loading, generateRecommendations]);

  if (loading) {
    return (
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-center">
                  <span className="flex flex-col items-center justify-center gap-2 sm:inline-flex sm:flex-row sm:items-center">
                    <span>{t('recommendations.generatingRecommendations')}</span>
                    <Sparkles className="h-5 w-5 text-primary animate-pulse sm:order-first" />
                  </span>
                </h2>
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-2xl mx-auto shadow-sm">
              <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-background border border-muted/20">
                  <img 
                    src="/lovable-uploads/cuizly-chef-icon.jpg" 
                    alt="Cuizly Chef Icon" 
                    className="h-12 w-12 object-contain" 
                  />
                </div>
                <div className="space-y-4 text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-center break-words">{t('recommendations.noRecommendationsTitle')}</h3>
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
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
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="text-sm text-muted-foreground">{formatRestaurantAddress(restaurant.address)}</span>
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
                           {restaurant.price_range && (
                             <>
                               <span className="text-xs text-muted-foreground">•</span>
                               <span className="text-xs font-bold text-muted-foreground">{restaurant.price_range}</span>
                             </>
                           )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">{t('recommendations.noRatingsYet')}</span>
                          {restaurant.price_range && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs font-bold text-muted-foreground">{restaurant.price_range}</span>
                            </>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {restaurant.cuisine_type?.sort((a, b) => {
                    const indexA = CUISINE_OPTIONS.indexOf(a);
                    const indexB = CUISINE_OPTIONS.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                  }).map((cuisine, idx) => {
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
                          <span className="leading-none">{CUISINE_TRANSLATIONS[cuisine.toLowerCase() as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}</span>
                        </Badge>
                    );
                  })}
                </div>

                {(() => {
                  const reasons = restaurant.reasons || [];
                  
                  return reasons.length > 0 && (
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/20">
                       <div className="flex items-center gap-2 mb-3">
                         <div className="flex items-center gap-1.5">
                           <Sparkles className="h-4 w-4 text-primary" />
                           <p className="text-sm font-semibold text-foreground">
                             {t('recommendations.whyThisChoice')}
                           </p>
                         </div>
                       </div>
                       <div className="space-y-2">
                            {reasons.slice(0, 3).map((reason, idx) => {
                              const reasonObj = typeof reason === 'string' ? { text: reason, type: 'default' } : reason;
                              
                              // Auto-detect reason type based on content for AI-generated reasons
                              if (reasonObj.type === 'default' && typeof reason === 'string') {
                                if (reason.toLowerCase().includes('allergène') || reason.toLowerCase().includes('allergen')) {
                                  reasonObj.type = 'allergens';
                                } else if (reason.toLowerCase().includes('restriction') || reason.toLowerCase().includes('dietary')) {
                                  reasonObj.type = 'dietary';
                                } else if (reason.toLowerCase().includes('cuisine') || reason.toLowerCase().includes('aimez')) {
                                  reasonObj.type = 'cuisine';
                                } else if (reason.toLowerCase().includes('prix') || reason.toLowerCase().includes('price')) {
                                  reasonObj.type = 'price';
                                } else if (reason.toLowerCase().includes('proche') || reason.toLowerCase().includes('distance') || reason.toLowerCase().includes('location')) {
                                  reasonObj.type = 'timing';
                                }
                              }
                              
                              const isAllergens = reasonObj.type === 'allergens';
                              
                              // Debug logging
                              console.log('🔍 REASON DEBUG:', {
                                reason,
                                reasonObj,
                                type: reasonObj.type,
                                isAllergens: isAllergens,
                                text: reasonObj.text
                              });
                             
                              return (
                                <div key={idx} className="flex items-center gap-2.5">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    isAllergens ? 'bg-red-500' : 
                                    reasonObj.type === 'dietary' ? 'bg-emerald-500' :
                                    reasonObj.type === 'price' ? 'bg-orange-500' : 
                                    reasonObj.type === 'cuisine' ? 'bg-blue-500' : 
                                    reasonObj.type === 'timing' ? 'bg-purple-500' :
                                    'bg-gray-400'
                                  }`} />
                                   <span className="text-xs text-foreground/80 leading-relaxed">
                                     {t(reasonObj.text) || reasonObj.text}
                                   </span>
                                </div>
                              );
                          })}
                       </div>
                    </div>
                  );
                })()}

                 <Button 
                   className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                   size="sm"
                   onClick={() => {
                     trackProfileView(restaurant.id);
                     navigate(`/restaurant/${restaurant.id}`);
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
      
      <RestaurantFiltersModal 
        open={showFilters}
        onOpenChange={setShowFilters}
        onApplyFilters={handleApplyFilters}
      />
    </section>
  );
};