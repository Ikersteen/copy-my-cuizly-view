import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin, Heart, Sparkles } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  price_range: string;
  rating?: number;
  delivery_time?: string;
  distance?: number;
  is_favorite?: boolean;
}

interface RecommendationEngineProps {
  preferences: UserPreferences | null;
}

export const RecommendationEngine = ({ preferences }: RecommendationEngineProps) => {
  const [recommendations, setRecommendations] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preferences) {
      generateRecommendations();
    }
  }, [preferences]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les restaurants actifs
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (!restaurants) {
        setRecommendations([]);
        return;
      }

      // Système de scoring intelligent basé sur les préférences
      const scoredRestaurants = restaurants.map(restaurant => {
        let score = 0;
        let reasons: string[] = [];

        // Score basé sur les cuisines préférées
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

        // Score basé sur la gamme de prix
        if (preferences?.price_range === restaurant.price_range) {
          score += 30;
          reasons.push("Dans votre budget");
        } else if (preferences?.price_range && restaurant.price_range) {
          const priceOrder = ["$", "$$", "$$$", "$$$$"];
          const prefIndex = priceOrder.indexOf(preferences.price_range);
          const restIndex = priceOrder.indexOf(restaurant.price_range);
          if (Math.abs(prefIndex - restIndex) === 1) {
            score += 15;
            reasons.push("Prix similaire");
          }
        }

        // Bonus pour les restaurants populaires (simulation)
        const rating = 3.5 + Math.random() * 1.5; // Rating simulé entre 3.5 et 5
        if (rating > 4.5) {
          score += 20;
          reasons.push("Très bien noté");
        } else if (rating > 4.0) {
          score += 10;
          reasons.push("Bien noté");
        }

        // Temps de livraison simulé
        const deliveryTime = Math.floor(15 + Math.random() * 40); // Entre 15 et 55 min
        if (preferences?.max_delivery_time && deliveryTime <= preferences.max_delivery_time) {
          score += 15;
          reasons.push("Livraison rapide");
        }

        // Distance simulée
        const distance = Math.floor(1 + Math.random() * (preferences?.delivery_radius || 10));
        if (distance <= (preferences?.delivery_radius || 10) / 2) {
          score += 10;
          reasons.push("Proche de vous");
        }

        return {
          ...restaurant,
          score,
          rating: Number(rating.toFixed(1)),
          delivery_time: `${deliveryTime}-${deliveryTime + 10} min`,
          distance: distance,
          reasons,
          is_favorite: Math.random() > 0.8 // Simulation de favoris
        };
      });

      // Trier par score et prendre les meilleurs
      const sortedRestaurants = scoredRestaurants
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setRecommendations(sortedRestaurants);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-cuizly-primary animate-pulse" />
          <h2 className="text-xl font-semibold">Recommandations pour vous</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-cuizly-surface rounded w-3/4"></div>
                <div className="h-3 bg-cuizly-surface rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-cuizly-surface rounded"></div>
                  <div className="h-3 bg-cuizly-surface rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Recommandé pour vous</h2>
        </div>
        {preferences?.cuisine_preferences?.length && (
          <Badge variant="outline">
            Basé sur vos goûts
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((restaurant, index) => (
          <Card 
            key={restaurant.id} 
            className={`shadow-card hover:shadow-elevated transition-all duration-200 ${
              index === 0 ? 'border-cuizly-primary' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                    {index === 0 && (
                      <Badge className="bg-cuizly-primary text-white text-xs">
                        Top choix
                      </Badge>
                    )}
                    {restaurant.is_favorite && (
                      <Heart className="h-4 w-4 fill-cuizly-accent text-cuizly-accent" />
                    )}
                  </div>
                  <p className="text-sm text-cuizly-neutral line-clamp-2">
                    {restaurant.description}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {restaurant.price_range}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informations principales */}
                <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
                <div className="flex items-center space-x-1 text-cuizly-neutral">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.delivery_time}</span>
                </div>
                <div className="flex items-center space-x-1 text-cuizly-neutral">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.distance} km</span>
                </div>
              </div>

              {/* Cuisines */}
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisine_type?.slice(0, 3).map((cuisine, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className={`text-xs ${
                      preferences?.cuisine_preferences?.includes(cuisine)
                        ? 'bg-cuizly-primary/10 text-cuizly-primary border-cuizly-primary/20'
                        : ''
                    }`}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>

              {/* Raisons de recommandation */}
              {(restaurant as any).reasons?.length > 0 && (
                <div className="bg-cuizly-surface/50 rounded-lg p-2">
                  <p className="text-xs text-cuizly-neutral font-medium mb-1">
                    Pourquoi ce choix ?
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(restaurant as any).reasons.slice(0, 2).map((reason: string, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs bg-white/50"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="sm"
              >
                Voir le menu
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {recommendations.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Sparkles className="h-12 w-12 text-cuizly-neutral mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-cuizly-neutral mb-2">
              Aucune recommandation pour le moment
            </h3>
            <p className="text-sm text-cuizly-neutral">
              Configurez vos préférences pour recevoir des suggestions personnalisées
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};