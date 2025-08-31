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
                        <Heart className={`h-4 w-4 ${favorites.includes(restaurant.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
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
                            className={`text-xs text-center justify-center flex items-center gap-1 ${
                              isPreferred
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                                : 'bg-muted/50 text-muted-foreground border-muted'
                            }`}
                          >
                            {isPreferred && <span className="text-xs">★</span>}
                            <span>{cuisine}</span>
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