import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Star, MapPin, ChefHat, Filter, Heart } from "lucide-react";
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
    console.log('🔍 Generating recommendations with preferences:', preferences);
    
    if (!preferences) {
      console.log('❌ No preferences available, will show all restaurants');
      // Ne pas sortir complètement, montrer tous les restaurants disponibles
    }

    console.log('🚀 Starting optimized recommendation generation');
    setLoading(true);
    
    try {
      // Récupération optimisée des données
      const [restaurantsResponse, menusResponse] = await Promise.all([
        supabase.rpc('get_public_restaurants'),
        supabase
          .from('menus')
          .select('restaurant_id, cuisine_type, dietary_restrictions, allergens')
          .eq('is_active', true)
      ]);

      if (restaurantsResponse.error) throw restaurantsResponse.error;
      if (menusResponse.error) throw menusResponse.error;

      const restaurantsData = restaurantsResponse.data || [];
      const menusData = menusResponse.data || [];

      console.log('📊 Found restaurants:', restaurantsData.length);
      console.log('🍽️ Found menus:', menusData.length);

      if (restaurantsData.length === 0) {
        console.log('❌ No restaurants found');
        setCategories([]);
        setLoading(false);
        return;
      }

      // Tentative d'utilisation de l'IA d'abord
      try {
        console.log('🤖 Trying AI recommendations...');
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-recommendations', {
          body: {
            restaurants: restaurantsData.slice(0, 20), // Limiter pour l'IA
            preferences: preferences,
            userId: (await supabase.auth.getUser()).data.user?.id
          }
        });

        if (!aiError && aiResult?.recommendations?.length > 0) {
          console.log('✅ AI recommendations successful:', aiResult.recommendations.length);
          
          // Récupérer les vraies notes en batch pour les recommandations IA
          const ratingsPromises = aiResult.recommendations.map(async (restaurant: any) => {
            const ratingData = await getRealRating(restaurant.id);
            return {
              ...restaurant,
              rating: ratingData.rating,
              totalRatings: ratingData.totalRatings,
              reasons: restaurant.ai_reasons || restaurant.reasons || [t('recommendations.aiRecommended')]
            };
          });

          const aiRestaurantsWithRatings = await Promise.all(ratingsPromises);

          setCategories([{
            id: 'ai-recommended',
            title: t('recommendations.aiRecommendations'),
            subtitle: t('recommendations.poweredByAI'),
            icon: Sparkles,
            color: 'bg-gradient-to-r from-primary/10 to-primary/5',
            restaurants: aiRestaurantsWithRatings
          }]);
          
          setLoading(false);
          return;
        }
      } catch (aiError) {
        console.log('🔄 AI not available, falling back to traditional scoring');
      }

      // Fallback optimisé au scoring traditionnel
      console.log('🎯 Using traditional scoring for', restaurantsData.length, 'restaurants');
      const scoredRestaurants = restaurantsData.map(restaurant => {
        let score = 0;
        let reasons: string[] = [];
        
        // Scoring simplifié mais efficace
        if (preferences?.cuisine_preferences?.length) {
          const restaurantMenus = menusData.filter(menu => menu.restaurant_id === restaurant.id);
          const cuisineMatches = restaurant.cuisine_type?.filter(cuisine =>
            preferences.cuisine_preferences.includes(cuisine)
          ) || [];
          
          const menuCuisineMatches = restaurantMenus.filter(menu =>
            preferences.cuisine_preferences.includes(menu.cuisine_type)
          );

          if (cuisineMatches.length > 0 || menuCuisineMatches.length > 0) {
            score += 30 + (cuisineMatches.length + menuCuisineMatches.length) * 10;
            reasons.push(`${cuisineMatches.length + menuCuisineMatches.length} ${t('recommendations.cuisineMatches')}`);
          }
        }

        if (preferences?.price_range && restaurant.price_range === preferences.price_range) {
          score += 20;
          reasons.push(t('recommendations.inYourBudget'));
        }

        if (preferences?.dietary_restrictions?.length) {
          score += 15;
          reasons.push(t('recommendations.accommodatesDiet'));
        }

        // Score de base pour tous les restaurants
        score += 10;
        if (reasons.length === 0) reasons.push(t('recommendations.availableRestaurant'));

        return {
          ...restaurant,
          score,
          reasons,
          rating: null, // Sera chargé plus tard
          totalRatings: 0
        };
      });

      // Trier TOUS les restaurants par score (pas de limite)
      const allRestaurants = scoredRestaurants
        .sort((a, b) => b.score - a.score);
      
      console.log('🏆 All restaurants selected:', allRestaurants.length);

      // Charger les ratings en batch
      const restaurantsWithRatings = await Promise.all(
        allRestaurants.map(async (restaurant) => {
          const ratingData = await getRealRating(restaurant.id);
          return {
            ...restaurant,
            rating: ratingData.rating,
            totalRatings: ratingData.totalRatings
          };
        })
      );

      const finalCategories = [{
        id: 'recommended',
        title: t('recommendations.recommendedForYou'),
        subtitle: t('recommendations.basedOnPreferences'),
        icon: Sparkles,
        color: 'bg-gradient-to-r from-primary/10 to-primary/5',
        restaurants: restaurantsWithRatings
      }];
      
      console.log('✅ Final categories set:', finalCategories.length, 'with total restaurants:', finalCategories[0]?.restaurants?.length);
      setCategories(finalCategories);

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [preferences, t]);

  const trackProfileView = async (restaurantId: string) => {
    try {
      // Utiliser la fonction database sécurisée
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

  // Charger les recommandations au montage et sur mise à jour des préférences
  useEffect(() => {
    if (preferences?.id) {
      generateRecommendations();
    }
  }, [preferences?.id, generateRecommendations]);

  // Écouter les événements de mise à jour des préférences
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

  // Écouter les mises à jour en temps réel (optionnel)
  useEffect(() => {
    const subscription = supabase
      .channel('recommendations_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'restaurants' },
        () => {
          if (preferences?.id && !loading) {
            setTimeout(() => generateRecommendations(), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [preferences?.id, loading, generateRecommendations]);

  if (loading) {
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

  return (
    <section className="py-8 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {categories.map((category) => (
          <div key={category.id} className="space-y-6">
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
                    {t('recommendations.filters')}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.restaurants.map((restaurant) => (
                <Card 
                  key={restaurant.id}
                  className="group cursor-pointer border-0 shadow-lg bg-white rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-6">
                    {/* Header avec nom et favoris */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {restaurant.logo_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={restaurant.logo_url} 
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                            <ChefHat className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {restaurant.name}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>Montreal</span>
                            {restaurant.price_range && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="font-medium">{restaurant.price_range}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(restaurant.id);
                        }}
                        className="p-2"
                      >
                        <Heart className={`h-6 w-6 ${favorites.includes(restaurant.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      </Button>
                    </div>

                    {/* Description avec emojis */}
                    <div className="mb-4">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        🌍✨ {getTranslatedDescription(restaurant, currentLanguage) || "Cuisine ouverte au monde"}
                      </p>
                      <p className="text-gray-700 text-sm leading-relaxed mt-1">
                        ✨🌍✈️ Un voyage culinaire unique vous attend...
                      </p>
                    </div>

                    {/* Note */}
                    <div className="mb-6">
                      {(() => {
                        const hasRating = restaurant.totalRatings && restaurant.totalRatings > 0 && restaurant.rating !== null && restaurant.rating > 0;
                        
                        if (hasRating) {
                          return (
                            <div className="flex items-center">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-medium text-gray-900">
                                {restaurant.rating} ({restaurant.totalRatings} {restaurant.totalRatings > 1 ? t('recommendations.evaluations') : t('recommendations.evaluation')})
                              </span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center">
                              <Star className="h-5 w-5 text-gray-300 mr-1" />
                              <span className="text-gray-500 text-sm">{t('recommendations.noRatingsYet')}</span>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Grille de badges cuisine avec fond noir */}
                    <div className="mb-6">
                      <div className="grid grid-cols-3 gap-2">
                        {restaurant.cuisine_type?.slice(0, 15).map((cuisine, idx) => {
                          const isPreferred = preferences?.cuisine_preferences?.includes(cuisine);
                          return (
                            <div
                              key={idx}
                              className={`px-3 py-2 rounded-full text-xs font-medium text-center flex items-center justify-center gap-1 ${
                                isPreferred
                                  ? 'bg-black text-white'
                                  : 'bg-black text-white'
                              }`}
                            >
                              <span className="text-white">★</span>
                              <span>{cuisine}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section "Pourquoi ce choix ?" */}
                    {restaurant.reasons && restaurant.reasons.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center mb-3 text-gray-600">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Pourquoi ce choix ?</span>
                        </div>
                        <div className="space-y-1">
                          {restaurant.reasons.slice(0, 2).map((reason, idx) => (
                            <div key={idx} className="text-sm text-gray-700">
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bouton noir "Voir le profil" */}
                    <Button
                      className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-xl font-medium"
                      onClick={() => {
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