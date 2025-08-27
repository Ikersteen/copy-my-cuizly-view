import React, { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, ChefHat, Sparkles } from 'lucide-react';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const RestaurantMapSection = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiKey, loading: keyLoading, error: keyError } = useGoogleMapsKey();
  const { preferences } = useUserPreferences();

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

  const generateRecommendedRestaurants = async () => {
    try {
      setLoading(true);

      const { data: restaurants, error } = await supabase
        .rpc('get_public_restaurants');

      if (error) throw error;

      if (!restaurants) {
        setRestaurants([]);
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
        
        // Add mock coordinates for Montreal area (since we don't have real geocoding)
        const baseLatitude = 45.5017;
        const baseLongitude = -73.5673;
        const randomOffsetLat = (Math.random() - 0.5) * 0.1; // ~5km range
        const randomOffsetLng = (Math.random() - 0.5) * 0.1;
        
        return {
          ...restaurant,
          score,
          rating: realRating.rating,
          totalRatings: realRating.totalRatings,
          reasons,
          geometry: {
            location: {
              lat: baseLatitude + randomOffsetLat,
              lng: baseLongitude + randomOffsetLng
            }
          }
        };
      }));

      // Sort by score and take only recommended ones (score > 0)
      const recommendedRestaurants = scoredRestaurants
        .filter(restaurant => restaurant.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      setRestaurants(recommendedRestaurants);

    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preferences) {
      generateRecommendedRestaurants();
    }
  }, [preferences]);

  const handleRestaurantsLoaded = () => {
    // This is no longer needed as we load restaurants from Supabase
  };

  if (loading || keyLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <div className="flex items-center space-x-2 mt-4">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h2 className="text-xl font-semibold">Chargement des restaurants recommandés...</h2>
            </div>
            <p className="text-muted-foreground mt-2">Analyse de vos préférences en cours</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              Vos restaurants recommandés sur la carte
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez sur la carte les restaurants sélectionnés spécialement pour vous selon vos préférences culinaires.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {keyError ? (
                  <div className="h-full flex items-center justify-center text-center p-6">
                    <div>
                      <p className="text-destructive mb-2">Erreur de configuration</p>
                      <p className="text-muted-foreground text-sm">
                        {keyError}
                      </p>
                    </div>
                  </div>
                ) : apiKey ? (
                  <GoogleMap 
                    center={{ lat: 45.5017, lng: -73.5673 }}
                    zoom={13}
                    apiKey={apiKey}
                    restaurants={restaurants}
                    onRestaurantsLoaded={handleRestaurantsLoaded}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-6">
                    <div>
                      <p className="text-muted-foreground">Impossible de charger la carte</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restaurant List */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  Recommandé pour vous
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {restaurants.length} restaurants sélectionnés
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[480px] overflow-y-auto">
                  {restaurants.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun restaurant recommandé pour le moment</p>
                        <p className="text-xs mt-1">Vérifiez vos préférences</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {restaurants.map((restaurant) => (
                        <Card 
                          key={restaurant.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedRestaurant?.id === restaurant.id 
                              ? 'ring-2 ring-primary' 
                              : ''
                          }`}
                          onClick={() => setSelectedRestaurant(restaurant)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              {restaurant.logo_url ? (
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={restaurant.logo_url} 
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <ChefHat className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                                  {restaurant.name}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {restaurant.description}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mb-2">
                              {restaurant.rating && restaurant.rating > 0 ? (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                  <span className="text-xs font-medium">
                                    {restaurant.rating} ({restaurant.totalRatings})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pas encore noté</span>
                              )}
                              {restaurant.price_range && (
                                <Badge variant="outline" className="text-xs">
                                  {restaurant.price_range}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {restaurant.cuisine_type?.slice(0, 2).map((cuisine) => (
                                <Badge 
                                  key={cuisine} 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1"
                                >
                                  {cuisine}
                                </Badge>
                              ))}
                            </div>

                            {restaurant.reasons && restaurant.reasons.length > 0 && (
                              <div className="bg-primary/5 rounded-lg p-2">
                                <div className="flex flex-wrap gap-1">
                                  {restaurant.reasons.slice(0, 2).map((reason, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="outline" 
                                      className="text-xs bg-background/80 text-primary border-primary/30"
                                    >
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Astuce :</strong> Seuls les restaurants recommandés selon vos préférences culinaires sont affichés sur cette carte
          </p>
        </div>
      </div>
    </section>
  );
};

export default RestaurantMapSection;