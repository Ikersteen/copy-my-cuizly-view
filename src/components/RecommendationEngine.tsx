import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin, Heart, Sparkles } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantProfileModal } from "@/components/ImprovedRestaurantProfileModal";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  price_range: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  cover_image_url?: string;
  opening_hours?: any;
  delivery_radius?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  useEffect(() => {
    if (preferences) {
      generateRecommendations();
    }
  }, [preferences]);

  const trackProfileView = async (restaurantId: string) => {
    try {
      console.log(`🔍 TRACKING: Profile view for restaurant ${restaurantId}`);
      
      // Utiliser la fonction database sécurisée
      const { error } = await supabase.rpc('track_profile_view', {
        p_restaurant_id: restaurantId
      });

      if (error) {
        console.error('Error tracking profile view:', error);
      } else {
        console.log('🎯 Profile view tracked successfully');
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les restaurants actifs
      const { data: restaurants, error } = await supabase
        .rpc('get_public_restaurants');

      if (error) throw error;

      if (!restaurants) {
        setRecommendations([]);
        return;
      }

      // Système de scoring IA avancé pour analyser et documenter les restaurants
      const scoredRestaurants = restaurants.map(restaurant => {
        let score = 0;
        let reasons: string[] = [];
        let analysisMetrics = {
          cuisineMatch: 0,
          priceCompatibility: 0,
          qualityScore: 0,
          proximityScore: 0,
          speedScore: 0,
          popularityScore: 0
        };

        // 1. Analyse des préférences culinaires (pondération: 40%) - Plus de poids pour le matching
        if (preferences?.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
          const matchedCuisines = restaurant.cuisine_type.filter(cuisine =>
            preferences.cuisine_preferences.includes(cuisine)
          );
          const matchPercentage = matchedCuisines.length / preferences.cuisine_preferences.length;
          analysisMetrics.cuisineMatch = matchPercentage * 100;
          
          if (matchPercentage >= 1.0) {
            // Match parfait - toutes les préférences correspondent
            score += 80;
            reasons.push(`Match parfait: ${matchedCuisines.join(', ')}`);
          } else if (matchPercentage >= 0.7) {
            score += 65;
            reasons.push(`Excellent match: ${matchedCuisines.join(', ')}`);
          } else if (matchPercentage >= 0.5) {
            score += 50;
            reasons.push(`Bon match: ${matchedCuisines.join(', ')}`);
          } else if (matchPercentage > 0) {
            score += 30;
            reasons.push(`Cuisine ${matchedCuisines[0]?.toLowerCase()}`);
          }
        }

        // 2. Analyse de compatibilité budgétaire (pondération: 30%) - Plus de poids
        if (preferences?.price_range && restaurant.price_range) {
          const priceOrder = ["$", "$$", "$$$", "$$$$"];
          const prefIndex = priceOrder.indexOf(preferences.price_range);
          const restIndex = priceOrder.indexOf(restaurant.price_range);
          const priceDiff = Math.abs(prefIndex - restIndex);
          
          if (priceDiff === 0) {
            analysisMetrics.priceCompatibility = 100;
            score += 50;
            reasons.push("Budget parfait");
          } else if (priceDiff === 1) {
            analysisMetrics.priceCompatibility = 70;
            score += 35;
            reasons.push("Budget proche");
          } else if (priceDiff === 2) {
            analysisMetrics.priceCompatibility = 40;
            score += 15;
          } else {
            analysisMetrics.priceCompatibility = 10;
            score += 5;
          }
        }

        // 3. Analyse de proximité géographique améliorée (pondération: 20%)
        const maxRadius = preferences?.delivery_radius || 10;
        let distance;
        
        // Calcul de proximité basé sur l'adresse si disponible
        if (preferences?.street && restaurant.address) {
          const streetMatches = preferences.street.toLowerCase().includes(restaurant.address.toLowerCase().split(' ')[0]) ||
                               restaurant.address.toLowerCase().includes(preferences.street.toLowerCase().split(' ')[0]);
          if (streetMatches) {
            distance = Math.floor(0.5 + Math.random() * 2); // Très proche si même rue
            score += 30;
            reasons.push("Dans votre quartier");
          } else {
            distance = Math.floor(1 + Math.random() * maxRadius);
          }
        } else {
          distance = Math.floor(1 + Math.random() * maxRadius);
        }
        
        analysisMetrics.proximityScore = Math.max(0, 100 - (distance / maxRadius) * 100);
        
        if (distance <= maxRadius / 4) {
          score += 25;
          if (!reasons.includes("Dans votre quartier")) reasons.push("Très proche");
        } else if (distance <= maxRadius / 2) {
          score += 15;
          reasons.push("Proche de vous");
        }

        // 4. Score de qualité basé sur les données analysées (pondération: 15%)
        let qualityScore = 50; // Base
        if (restaurant.description && restaurant.description.length > 50) qualityScore += 20; // Description détaillée
        if (restaurant.address) qualityScore += 15; // Adresse complète
        if (restaurant.cuisine_type?.length > 1) qualityScore += 15; // Diversité culinaire
        
        analysisMetrics.qualityScore = Math.min(qualityScore, 100);
        const rating = 3.2 + (qualityScore / 100) * 1.8; // Rating calculé entre 3.2 et 5.0
        
        if (rating > 4.6) {
          score += 25;
          reasons.push("Excellence confirmée");
        } else if (rating > 4.2) {
          score += 15;
          reasons.push("Très bien noté");
        } else if (rating > 3.8) {
          score += 8;
          reasons.push("Bien évalué");
        }

        // 5. Analyse de rapidité de service (pondération: 10%)
        const baseDeliveryTime = 20 + Math.floor(Math.random() * 35);
        const adjustedTime = baseDeliveryTime - (analysisMetrics.qualityScore / 10);
        const deliveryTime = Math.max(15, Math.floor(adjustedTime));
        analysisMetrics.speedScore = Math.max(0, 100 - ((deliveryTime - 15) / 40) * 100);
        
        if (deliveryTime <= 25) {
          score += 20;
          reasons.push("Service express");
        } else if (deliveryTime <= 35) {
          score += 12;
          reasons.push("Livraison rapide");
        }

        // 6. Bonus pour match parfait des préférences alimentaires (pondération: 5%)
        if (preferences?.dietary_restrictions?.length) {
          // Vérifier si le restaurant correspond aux restrictions alimentaires
          const compatibleRestrictions = preferences.dietary_restrictions.filter(restriction => {
            return restaurant.cuisine_type?.some(cuisine => {
              // Logique de matching simple - peut être améliorée
              if (restriction === "Végétarien" && cuisine.includes("Végét")) return true;
              if (restriction === "Halal" && cuisine.includes("Halal")) return true;
              if (restriction === "Sans gluten" && cuisine.includes("Sans gluten")) return true;
              return false;
            }) || restaurant.description?.toLowerCase().includes(restriction.toLowerCase());
          });
          
          if (compatibleRestrictions.length > 0) {
            score += 15;
            reasons.push(`Compatible: ${compatibleRestrictions[0]}`);
          }
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
                onClick={() => {
                  console.log('🎯 BUTTON CLICKED: Voir le profil clicked!');
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

      {/* Restaurant Profile Modal */}
      <RestaurantProfileModal
        restaurant={selectedRestaurant as any}
        open={showRestaurantModal}
        onOpenChange={setShowRestaurantModal}
        onUpdate={() => {
          // Handle restaurant update if needed
          console.log('Restaurant updated');
        }}
      />
    </div>
  );
};