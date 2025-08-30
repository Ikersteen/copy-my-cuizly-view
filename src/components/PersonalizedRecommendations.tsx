import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Clock, Star, MapPin, ChefHat, ArrowRight, Filter, History, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useFavorites } from "@/hooks/useFavorites";
import { RestaurantMenuModal } from "@/components/RestaurantMenuModal";
import { RestaurantFiltersModal, RestaurantFilterOptions } from "@/components/RestaurantFiltersModal";
import { useTranslation } from "react-i18next";
import { useLanguage } from '@/hooks/useLanguage';
import { CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getTranslatedDescription } from "@/lib/translations";

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
  restaurant_specialties?: string[];
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

export const PersonalizedRecommendations = ({ showOnlyFavorites = false }: { showOnlyFavorites?: boolean }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const { favorites, toggleFavorite } = useFavorites();
  const [categories, setCategories] = useState<RecommendationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});

  // Function to get translated cuisine name
  const getCuisineTranslation = (cuisineKey: string) => {
    return CUISINE_TRANSLATIONS[cuisineKey as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisineKey;
  };

  // Réduire les logs excessifs
  // console.log('PersonalizedRecommendations component loaded');
  // console.log('Initial state - loading:', loading, 'categories:', categories.length, 'preferences:', preferences);

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

  const generateRecommendations = useCallback(async () => {
    console.log('🔄 generateRecommendations called - loading:', loading);
    
    setLoading(true);
    console.log('🔄 Setting loading to true');
    
    try {
      console.log('=== GENERATING RECOMMENDATIONS ===');
      console.log('Current preferences:', preferences);

      // Vérifier la connectivité réseau
      if (!navigator.onLine) {
        throw new Error('Pas de connexion Internet');
      }

      // Fetch restaurants and menus data separately for better error handling
      console.log('Fetching restaurants and menus...');
      const [restaurantsResponse, menusResponse] = await Promise.all([
        supabase.rpc('get_public_restaurants'),
        supabase
          .from('menus')
          .select('*')
          .eq('is_active', true)
      ]);

      console.log('Restaurants response:', restaurantsResponse);
      console.log('Menus response:', menusResponse);

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
      console.log('Sample restaurant data:', restaurantsData[0]);
      console.log('Sample menu data:', menusData[0]);

      if (restaurantsData.length === 0) {
        console.log('No restaurants found');
        setCategories([]);
        setLoading(false);
        return;
      }

        const scoredRestaurants = await Promise.all(restaurantsData.map(async (restaurant) => {
        let score = 0;
        let reasons: string[] = [];
        let hasStrictMatch = false;

        // Get restaurant's menus for strict matching
        const restaurantMenus = menusData.filter(menu => menu.restaurant_id === restaurant.id);
        
        console.log(`Restaurant ${restaurant.name} has ${restaurantMenus.length} menus`);
        
        // Analyse de scoring - afficher des recommandations même sans préférences strictes
        if (!preferences || 
            (!preferences.cuisine_preferences?.length && 
             !preferences.price_range && 
             !preferences.dietary_restrictions?.length &&
             !preferences.allergens?.length)) {
          console.log(`No specific preferences set, providing general recommendations for ${restaurant.name}`);
          // Attribuer un score de base pour les restaurants sans matching strict
          score += 5;
          reasons.push(t('recommendations.popularRestaurant'));
          hasStrictMatch = true; // Permettre l'affichage
        }
        
        // Compter le nombre total de préférences définies pour déterminer le niveau de strictness
        const totalPreferences = (preferences.cuisine_preferences?.length || 0) +
                                (preferences.price_range ? 1 : 0) +
                                (preferences.dietary_restrictions?.length || 0) +
                                (preferences.allergens?.length || 0);
        
        const isFlexibleMode = totalPreferences === 1; // Mode flexible si une seule préférence
        
        // 1. Cuisine preferences match - Flexible si une seule préférence
        if (preferences.cuisine_preferences && preferences.cuisine_preferences.length > 0) {
          const matchingCuisines = restaurant.cuisine_type?.filter((cuisine: string) => 
            preferences.cuisine_preferences.includes(cuisine)
          ) || [];
          
          // Vérifier aussi les cuisines des menus
          const menuCuisineMatches = restaurantMenus.filter(menu => 
            preferences.cuisine_preferences.includes(menu.cuisine_type)
          );
          
          if (matchingCuisines.length > 0 || menuCuisineMatches.length > 0) {
            hasStrictMatch = true;
            score += (matchingCuisines.length + menuCuisineMatches.length) * 10;
            reasons.push(`${matchingCuisines.length + menuCuisineMatches.length} ${t('recommendations.cuisineMatches')}`);
          } else if (isFlexibleMode) {
            // En mode flexible, donner des points même sans correspondance exacte
            console.log(`No exact cuisine match for ${restaurant.name}, but showing in flexible mode`);
            hasStrictMatch = true;
            score += 3; // Score plus faible mais permet l'affichage
            reasons.push(t('recommendations.discoverRestaurant'));
          } else {
            console.log(`No cuisine match for ${restaurant.name}, excluding in strict mode`);
            return null; // STRICT: Pas de match cuisine = exclusion
          }
        }
        
        // 2. Price range match - Plus flexible
        if (preferences.price_range && preferences.price_range !== "") {
          if (restaurant.price_range === preferences.price_range) {
            hasStrictMatch = true;
            score += 15;
            reasons.push(t('recommendations.inYourBudget'));
          } else {
            // Plus flexible: accepter des restaurants proches du budget
            const priceOrder = ['$', '$$', '$$$', '$$$$'];
            const userPriceIndex = priceOrder.indexOf(preferences.price_range);
            const restaurantPriceIndex = priceOrder.indexOf(restaurant.price_range);
            
            if (Math.abs(userPriceIndex - restaurantPriceIndex) <= 1) {
              hasStrictMatch = true;
              score += 8; // Score réduit mais accepté
              if (restaurantPriceIndex < userPriceIndex) {
                console.log(`Restaurant ${restaurant.name} is more economical: ${restaurant.price_range} vs user's ${preferences.price_range}`);
                console.log('Adding economicOption translation');
                reasons.push(t('recommendations.economicOption'));
              } else {
                console.log(`Restaurant ${restaurant.name} is more expensive: ${restaurant.price_range} vs user's ${preferences.price_range}`);
                reasons.push(t('recommendations.moreExpensive'));
              }
              console.log(`Price range close match for ${restaurant.name} (${restaurant.price_range} vs ${preferences.price_range}), including`);
            } else {
              // En mode flexible, accepter quand même avec score très bas
              if (isFlexibleMode) {
                hasStrictMatch = true;
                score += 2;
                reasons.push(t('recommendations.differentBudget'));
                console.log(`Price range different but allowing in flexible mode for ${restaurant.name}`);
              } else {
                console.log(`Price range too different for ${restaurant.name} (${restaurant.price_range} vs ${preferences.price_range}), excluding`);
                return null;
              }
            }
          }
        }
        
        // 3. STRICT Dietary restrictions compatibility - OBLIGATOIRE si défini
        if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
          if (restaurantMenus.length === 0) {
            console.log(`No menus to check dietary restrictions for ${restaurant.name}, but allowing anyway`);
            // Allow restaurants without menus - they might have suitable options
            hasStrictMatch = true;
            score += 5; // Small bonus for being available
            reasons.push(t('recommendations.exploreMenu'));
          } else {
            let compatibleMenusCount = 0;
            
            console.log(`Checking dietary restrictions for ${restaurant.name}:`, preferences.dietary_restrictions);
            
            restaurantMenus.forEach(menu => {
              console.log(`Menu "${menu.description}" dietary restrictions:`, menu.dietary_restrictions);
              const accommodatedRestrictions = preferences.dietary_restrictions.filter((restriction: string) =>
                menu.dietary_restrictions?.includes(restriction)
              );
              if (accommodatedRestrictions.length === preferences.dietary_restrictions.length) {
                compatibleMenusCount++;
                score += accommodatedRestrictions.length * 8;
                console.log(`Menu fully compatible! All restrictions accommodated:`, accommodatedRestrictions);
              }
            });
            
            if (compatibleMenusCount > 0) {
              hasStrictMatch = true;
              const percentage = Math.round((compatibleMenusCount / restaurantMenus.length) * 100);
              reasons.push(`${percentage}% ${t('recommendations.dishesAdapted')}`);
              console.log(`${compatibleMenusCount}/${restaurantMenus.length} menus compatible for ALL dietary restrictions`);
            } else {
              console.log(`No menus accommodate ALL dietary restrictions for ${restaurant.name}, but allowing anyway`);
              // Allow restaurants even if menus don't match perfectly
              hasStrictMatch = true;
              score += 2; // Small score for availability
              reasons.push(t('recommendations.checkOptions'));
            }
          }
        }
        
        // 4. STRICT Allergen safety - OBLIGATOIRE si défini
        if (preferences.allergens && preferences.allergens.length > 0) {
          if (restaurantMenus.length === 0) {
            console.log(`No menus to check allergens for ${restaurant.name}, but allowing with caution`);
            // Allow restaurants without menus but add caution
            hasStrictMatch = true;
            score += 1; // Very small score due to uncertainty
            reasons.push(t('recommendations.checkAllergensOnSite'));
          } else {
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
                console.log(`Unsafe menu found! Dangerous allergens:`, dangerousAllergens);
              } else {
                safeMenusCount++;
              }
            });
            
            // If all menus are safe, give full points
            if (!hasUnsafeMenus && restaurantMenus.length > 0) {
              hasStrictMatch = true;
              score += 20;
              reasons.push(t('recommendations.allDishesSafe'));
              console.log(`All ${restaurantMenus.length} menus are safe for allergens`);
            } else if (hasUnsafeMenus) {
              // Some menus have allergens, but still allow with warning
              hasStrictMatch = true;
              score += 1; // Very low score due to risk
              reasons.push(t('recommendations.cautionAllergens'));
              console.log(`Some menus contain allergens for ${restaurant.name}, but allowing with warning`);
            }
          }
        }

        // 5. Favorite meal times match avec Restaurant specialties - BONUS si défini
        if (preferences.favorite_meal_times && preferences.favorite_meal_times.length > 0) {
          const currentHour = new Date().getHours();
          let timeMatch = false;
          let specialtyMatch = false;
          
          console.log(`Checking meal times for ${restaurant.name}. Current hour: ${currentHour}, User meal times:`, preferences.favorite_meal_times);
          console.log(`Restaurant specialties:`, (restaurant as any).restaurant_specialties);
          
          preferences.favorite_meal_times.forEach((mealTime: string) => {
            const mealTimeLower = mealTime.toLowerCase();
            
            // Vérification de correspondance avec les spécialités du restaurant
            if ((restaurant as any).restaurant_specialties) {
              (restaurant as any).restaurant_specialties.forEach((specialty: string) => {
                const specialtyLower = specialty.toLowerCase();
                
                // Correspondance breakfast/brunch
                if ((mealTimeLower.includes('breakfast') || mealTimeLower.includes('petit-déjeuner') || mealTimeLower.includes('brunch')) &&
                    (specialtyLower.includes('breakfast') || specialtyLower.includes('brunch'))) {
                  specialtyMatch = true;
                  if (currentHour >= 6 && currentHour < 11) timeMatch = true;
                }
                
                // Correspondance lunch
                if ((mealTimeLower.includes('lunch') || mealTimeLower.includes('déjeuner') || mealTimeLower.includes('quick')) &&
                    (specialtyLower.includes('lunch') || specialtyLower.includes('quick'))) {
                  specialtyMatch = true;
                  if (currentHour >= 11 && currentHour < 15) timeMatch = true;
                }
                
                // Correspondance dinner
                if ((mealTimeLower.includes('dinner') || mealTimeLower.includes('dîner')) &&
                    (specialtyLower.includes('dinner') || specialtyLower.includes('dîner'))) {
                  specialtyMatch = true;
                  if (currentHour >= 17 && currentHour < 23) timeMatch = true;
                }
                
                // Correspondance late night
                if ((mealTimeLower.includes('late') || mealTimeLower.includes('tard') || mealTimeLower.includes('night')) &&
                    (specialtyLower.includes('late') || specialtyLower.includes('night'))) {
                  specialtyMatch = true;
                  if (currentHour >= 23 || currentHour < 6) timeMatch = true;
                }
                
                // Correspondance snack/coffee
                if ((mealTimeLower.includes('collation') || mealTimeLower.includes('snack') || mealTimeLower.includes('coffee')) &&
                    (specialtyLower.includes('snack') || specialtyLower.includes('coffee'))) {
                  specialtyMatch = true;
                  if (currentHour >= 14 && currentHour < 17) timeMatch = true;
                }
              });
            }
            
            // Fallback: vérification horaire sans spécialité si pas de correspondance
            if (!specialtyMatch) {
              if (mealTimeLower.includes('breakfast') || mealTimeLower.includes('petit-déjeuner') || mealTimeLower.includes('brunch')) {
                if (currentHour >= 6 && currentHour < 11) timeMatch = true;
              }
              if (mealTimeLower.includes('lunch') || mealTimeLower.includes('déjeuner') || mealTimeLower.includes('quick')) {
                if (currentHour >= 11 && currentHour < 15) timeMatch = true;
              }
              if (mealTimeLower.includes('dinner') || mealTimeLower.includes('dîner')) {
                if (currentHour >= 17 && currentHour < 23) timeMatch = true;
              }
              if (mealTimeLower.includes('late') || mealTimeLower.includes('tard') || mealTimeLower.includes('night')) {
                if (currentHour >= 23 || currentHour < 6) timeMatch = true;
              }
              if (mealTimeLower.includes('collation') || mealTimeLower.includes('snack')) {
                if (currentHour >= 14 && currentHour < 17) timeMatch = true;
              }
            }
          });
          
          // Scoring basé sur la correspondance
          if (specialtyMatch && timeMatch) {
            hasStrictMatch = true;
            score += 20; // Score élevé pour double correspondance
            reasons.push(t('recommendations.perfectTimingSpecialty'));
            console.log(`Perfect specialty + timing match for ${restaurant.name}`);
          } else if (specialtyMatch) {
            hasStrictMatch = true;
            score += 12; // Score moyen pour correspondance spécialité
            reasons.push(t('recommendations.specialtyMatch'));
            console.log(`Specialty match for ${restaurant.name}`);
          } else if (timeMatch) {
            hasStrictMatch = true;
            score += 8; // Score plus faible pour horaire seulement
            reasons.push(t('recommendations.perfectTiming'));
            console.log(`Timing match only for ${restaurant.name}`);
          }
        }

        // 6. Delivery radius compatibility - BONUS si défini
        if (preferences.delivery_radius && restaurant.delivery_radius) {
          console.log(`Checking delivery radius for ${restaurant.name}: restaurant ${restaurant.delivery_radius}km vs user ${preferences.delivery_radius}km`);
          
          if (restaurant.delivery_radius >= preferences.delivery_radius) {
            hasStrictMatch = true;
            score += 8;
            reasons.push(t('recommendations.deliveryAvailable'));
            console.log(`Delivery radius compatible for ${restaurant.name}`);
          } else {
            // Pénaliser si le restaurant ne peut pas livrer
            score -= 10;
            reasons.push(t('recommendations.limitedDelivery'));
            console.log(`Limited delivery for ${restaurant.name}`);
          }
        }

        // STRICT: Si aucun match strict n'a été trouvé, exclure le restaurant
        // En mode flexible (une seule préférence), on est plus permissif
        if (!hasStrictMatch && !isFlexibleMode) {
          console.log(`No strict matches found for ${restaurant.name}, excluding`);
          return null;
        }
        
      // Si on est en mode flexible et qu'on n'a pas encore de match, donner une chance
      if (!hasStrictMatch && isFlexibleMode) {
        console.log(`Flexible mode: giving ${restaurant.name} a base score`);
        hasStrictMatch = true;
        score += 2;
        reasons.push(t('recommendations.suggestedRestaurant'));
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

    // Filter favorites if showOnlyFavorites is true
    let filteredRestaurants = validRestaurants;
    if (showOnlyFavorites) {
      filteredRestaurants = validRestaurants.filter(restaurant => favorites.includes(restaurant.id));
      console.log(`Filtered to favorites: ${filteredRestaurants.length} restaurants`);
    }

    await loadRestaurantRatings(filteredRestaurants);

    const newCategories: RecommendationCategory[] = [];
    
    if (filteredRestaurants.length > 0) {
      const sortedRestaurants = filteredRestaurants.sort((a, b) => b.score - a.score);
      console.log('Top 3 restaurants by score:', sortedRestaurants.slice(0, 3).map(r => ({ name: r.name, score: r.score, reasons: r.reasons })));
      
      newCategories.push({
        id: showOnlyFavorites ? 'favorites' : 'recommended',
        title: showOnlyFavorites ? t('yourFavorites') : t('recommendations.recommendedForYou'),
        subtitle: showOnlyFavorites ? t('favoriteRestaurants') : t('recommendations.basedOnPreferences'),
        icon: showOnlyFavorites ? Heart : Sparkles,
        color: 'bg-gradient-to-r from-primary/10 to-primary/5',
        restaurants: sortedRestaurants.slice(0, 12)
      });
    }

      // Si aucun restaurant trouvé avec les critères stricts, essayer un fallback
      if (validRestaurants.length === 0) {
        console.log('No restaurants found with strict criteria, trying fallback...');
        
        // Fallback: prendre tous les restaurants disponibles avec scores minimaux
        const fallbackRestaurants = await Promise.all(restaurantsData.map(async (restaurant: any) => {
          const realRating = await getRealRating(restaurant.id);
          
          return {
            ...restaurant,
            score: 5, // Score minimal pour tous
            rating: realRating.rating,
            totalRatings: realRating.totalRatings,
            reasons: [t('recommendations.restaurantAvailable'), t('recommendations.exploreNewTastes')]
          };
        }));
        
        await loadRestaurantRatings(fallbackRestaurants);
        
        if (fallbackRestaurants.length > 0) {
          newCategories.push({
            id: 'available',
            title: t('recommendations.availableRestaurants'),
            subtitle: t('recommendations.discoverMontreal'),
            icon: MapPin,
            color: 'bg-gradient-to-r from-blue-50 to-blue-100',
            restaurants: fallbackRestaurants.slice(0, 12)
          });
          
          console.log(`Added fallback category with ${fallbackRestaurants.length} restaurants`);
        }
      }

      setCategories(newCategories);
      console.log(`Set ${newCategories.length} categories with ${newCategories[0]?.restaurants?.length || 0} restaurants`);
      console.log('✅ Recommendations generated successfully, setting loading to false');

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      
      // Vérifier le type d'erreur et afficher un message approprié
      if (!navigator.onLine) {
        console.error('🌐 Network offline');
      } else if (error?.message?.includes('Load failed') || error?.message?.includes('TypeError')) {
        console.error('🔌 Connection issue detected');
      }
      
      setCategories([]);
    } finally {
      setLoading(false);
      console.log('✅ Loading set to false in finally block');
    }
  }, [preferences]); // Dépendances pour useCallback

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

  // Charger les recommandations une seule fois au montage
  useEffect(() => {
    if (preferences?.id) {
      console.log('🚀 Initial recommendations generation triggered for preferences:', preferences.id);
      generateRecommendations();
    }
  }, [preferences?.id]); // Supprimer generateRecommendations des dépendances

  // Écouter les mises à jour des préférences - une seule source de vérité
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    
    const handlePreferencesUpdate = () => {
      console.log('🔔 preferencesUpdated event received - loading:', loading);
      console.log('🔔 Current preferences:', preferences);
      
      // Toujours permettre la régénération si on a des préférences
      if (preferences?.id) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log('⏰ Debounced preferences update executing with preferences:', preferences);
          if (!loading) {
            console.log('🚀 Triggering generateRecommendations from event');
            generateRecommendations();
          } else {
            console.log('⏸️ Still loading, will retry in 1s');
            setTimeout(() => {
              if (preferences?.id && !loading) {
                console.log('🔄 Retry generateRecommendations after loading');
                generateRecommendations();
              }
            }, 1000);
          }
        }, 300); // Debounce réduit
      } else {
        console.log('❌ No preferences available for update');
      }
    };

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate);
    
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('preferencesUpdated', handlePreferencesUpdate);
    };
  }, [preferences?.id, loading]); // Inclure preferences?.id dans les dépendances

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

  console.log('Rendering PersonalizedRecommendations - loading:', loading, 'categories:', categories.length);

  if (loading) {
    console.log('Rendering loading state');
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <div className="flex items-center space-x-2 mt-4">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold whitespace-nowrap">{t('recommendations.generatingRecommendations')}</h2>
                <p className="text-xs sm:text-base text-muted-foreground">{t('recommendations.analyzingPreferences')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    console.log('Rendering no recommendations state');
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
                  <h2 className="text-2xl font-bold">{t('recommendations.noRecommendationsTitle')}</h2>
                  <p className="text-muted-foreground max-w-lg">
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
                    onClick={async () => {
                      setLoading(true);
                      await generateRecommendations();
                    }}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? t('recommendations.refreshing') : t('recommendations.refreshRecommendations')}
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

  console.log('Rendering recommendations with', categories.length, 'categories');
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
            <h3 className="text-lg font-semibold mb-1">{t('recommendations.filters')}</h3>
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
                            {getTranslatedDescription(restaurant, currentLanguage)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(restaurant.id);
                          }}
                        >
                          <Heart 
                            className={`h-5 w-5 transition-colors ${
                              favorites.includes(restaurant.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground hover:text-red-500'
                            }`} 
                          />
                        </Button>
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
                        {!showOnlyFavorites && (
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
                                  <span>{getCuisineTranslation(cuisine)}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                      {!showOnlyFavorites && restaurant.reasons && restaurant.reasons.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
           <h4 className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
             <Sparkles className="h-3 w-3" />
             {t('recommendations.whyChoice')}
           </h4>
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
                      {t('recommendations.viewProfile')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

             <div className="md:hidden text-center flex gap-2 justify-center flex-wrap">
               <Button variant="outline" size="sm" className="group" onClick={() => setShowFilters(true)}>
                 <Filter className="h-4 w-4 mr-0.5" />
                 {t('recommendations.filters')}
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