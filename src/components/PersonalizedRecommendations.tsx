import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Clock, Star, MapPin, ChefHat, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";

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

  useEffect(() => {
    if (preferences) {
      generateRecommendations();
    }
  }, [preferences]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);

      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (!restaurants) {
        setCategories([]);
        return;
      }

      // Score et catégorise les restaurants
      const scoredRestaurants = restaurants.map(restaurant => {
        let score = 0;
        let reasons: string[] = [];

        // Score basé sur les préférences de cuisine
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

        // Score prix
        if (preferences?.price_range === restaurant.price_range) {
          score += 30;
          reasons.push("Dans votre budget");
        }

        const rating = 3.5 + Math.random() * 1.5;
        const deliveryTime = Math.floor(15 + Math.random() * 40);

        return {
          ...restaurant,
          score,
          rating: Number(rating.toFixed(1)),
          delivery_time: `${deliveryTime}-${deliveryTime + 10} min`,
          reasons
        };
      });

      // Créer les catégories
      const newCategories: RecommendationCategory[] = [
        {
          id: 'recommended',
          title: 'Recommandé pour vous',
          subtitle: 'Basé sur vos préférences culinaires',
          icon: Sparkles,
          color: 'bg-gradient-to-r from-primary/10 to-primary/5',
          restaurants: scoredRestaurants
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
        },
        {
          id: 'trending',
          title: 'Tendances du moment',
          subtitle: 'Les restaurants les plus populaires',
          icon: TrendingUp,
          color: 'bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-900/10',
          restaurants: scoredRestaurants
            .filter(r => r.rating && r.rating > 4.3)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 6)
        },
        {
          id: 'fast',
          title: 'Livraison express',
          subtitle: 'Prêt en moins de 30 minutes',
          icon: Clock,
          color: 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10',
          restaurants: scoredRestaurants
            .filter(r => r.delivery_time && parseInt(r.delivery_time) <= 30)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6)
        }
      ];

      // Filtrer les catégories avec des restaurants
      const filteredCategories = newCategories.filter(cat => cat.restaurants.length > 0);
      setCategories(filteredCategories);

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
          <div className="animate-pulse space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-6">
                <div className="h-8 bg-muted rounded w-80"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-64 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-muted/30 via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {categories.map((category) => (
          <div key={category.id} className="space-y-8">
            {/* En-tête de catégorie */}
            <div className={`rounded-2xl p-6 ${category.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {category.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {category.subtitle}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="hidden md:flex group">
                  Voir tout
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Grille de restaurants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.restaurants.map((restaurant) => (
                <Card 
                  key={restaurant.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:-translate-y-2 bg-gradient-to-br from-card to-card/80"
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
                          <CardDescription className="line-clamp-2 text-sm mt-1">
                            {restaurant.description || "Restaurant de qualité"}
                          </CardDescription>
                        </div>
                      </div>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex items-center justify-between text-sm pt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span className="font-medium">{restaurant.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{restaurant.delivery_time}</span>
                      </div>
                      {restaurant.price_range && (
                        <Badge variant="secondary" className="text-xs">
                          {restaurant.price_range}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Types de cuisine */}
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisine_type?.slice(0, 3).map((cuisine, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className={`text-xs ${
                            preferences?.cuisine_preferences?.includes(cuisine)
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : ''
                          }`}
                        >
                          {cuisine}
                        </Badge>
                      ))}
                    </div>

                    {/* Raisons de recommandation */}
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

                    {/* Adresse */}
                    {restaurant.address && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{restaurant.address}</span>
                      </div>
                    )}

                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                      size="sm"
                    >
                      Voir le menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Voir plus mobile */}
            <div className="md:hidden text-center">
              <Button variant="outline" className="group">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};