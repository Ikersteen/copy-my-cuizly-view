import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, MapPin, Heart, Sparkles, ChefHat, Phone, Mail, Eye, Menu as MenuIcon } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";
import { useFavorites } from "@/hooks/useFavorites";
import { useRatings } from "@/hooks/useRatings";
import { supabase } from "@/integrations/supabase/client";
import { RatingComponent } from "@/components/RatingComponent";

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
  rating?: number;
  delivery_time?: string;
  distance?: number;
  score?: number;
  reasons?: string[];
  analytics?: {
    profile_views: number;
    menu_views: number;
    rating_count: number;
    average_rating: number;
  };
}

interface Menu {
  id: string;
  restaurant_id: string;
  description: string;
  cuisine_type: string;
  image_url: string;
}

interface EnhancedRecommendationEngineProps {
  preferences: UserPreferences | null;
}

export const EnhancedRecommendationEngine = ({ preferences }: EnhancedRecommendationEngineProps) => {
  const [recommendations, setRecommendations] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantMenus, setRestaurantMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { ratings, addRating } = useRatings();

  // Fonction pour récupérer la vraie note d'un restaurant
  const getRealRating = async (restaurantId: string): Promise<number | null> => {
    try {
      const { data } = await supabase
        .from('ratings')
        .select('rating')
        .eq('restaurant_id', restaurantId);

      if (!data || data.length === 0) return null;
      
      const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return Math.round(average * 10) / 10; // Arrondi à 1 décimale
    } catch (error) {
      console.error('Error fetching rating:', error);
      return null;
    }
  };

  useEffect(() => {
    if (preferences) {
      generateRecommendations();
    }
  }, [preferences]);

  const trackInteraction = async (restaurantId: string, action: 'profile_view' | 'menu_view' | 'offer_click') => {
    try {
      // Mettre à jour les analytics en temps réel
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingAnalytics } = await supabase
        .from('restaurant_analytics')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('date', today)
        .single();

      const updates: any = {};
      if (action === 'profile_view') updates.profile_views = (existingAnalytics?.profile_views || 0) + 1;
      if (action === 'menu_view') updates.menu_views = (existingAnalytics?.menu_views || 0) + 1;
      if (action === 'offer_click') updates.offer_clicks = (existingAnalytics?.offer_clicks || 0) + 1;

      if (existingAnalytics) {
        await supabase
          .from('restaurant_analytics')
          .update(updates)
          .eq('id', existingAnalytics.id);
      } else {
        await supabase
          .from('restaurant_analytics')
          .insert({
            restaurant_id: restaurantId,
            date: today,
            ...updates
          });
      }
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      // Récupérer restaurants avec analytics (excluant les informations de contact sensibles)
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          description,
          address,
          cuisine_type,
          price_range,
          opening_hours,
          logo_url,
          cover_image_url,
          delivery_radius,
          is_active,
          created_at,
          updated_at,
          restaurant_analytics(
            profile_views,
            menu_views, 
            rating_count,
            average_rating
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (!restaurants) {
        setRecommendations([]);
        return;
      }

      // Système de scoring basé sur interactions réelles et préférences
      const scoredRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
        let score = 0;
        let reasons: string[] = [];
        
        // Analytics réelles
        const analytics = Array.isArray(restaurant.restaurant_analytics) 
          ? restaurant.restaurant_analytics[0] 
          : {
              profile_views: 0,
              menu_views: 0,
              rating_count: 0,
              average_rating: 0
            };

        // 1. Score basé sur préférences utilisateur (40%)
        if (preferences?.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
          const matchedCuisines = restaurant.cuisine_type.filter(cuisine =>
            preferences.cuisine_preferences.includes(cuisine)
          );
          if (matchedCuisines.length > 0) {
            score += 40 * (matchedCuisines.length / preferences.cuisine_preferences.length);
            reasons.push(`${matchedCuisines.length} cuisine(s) favorite(s)`);
          }
        }

        // 2. Score prix (20%)
        if (preferences?.price_range === restaurant.price_range) {
          score += 20;
          reasons.push("Dans votre budget");
        }

        // 3. Score popularité basé sur vues réelles (25%)
        const popularityScore = Math.min(analytics.profile_views / 100, 1) * 25;
        score += popularityScore;
        if (analytics.profile_views > 50) {
          reasons.push("Restaurant populaire");
        }

        // 4. Score qualité basé sur notes réelles (15%)
        if (analytics.average_rating > 0) {
          const qualityScore = (analytics.average_rating / 5) * 15;
          score += qualityScore;
          if (analytics.average_rating > 4.5) {
            reasons.push("Excellemment noté");
          } else if (analytics.average_rating > 4) {
            reasons.push("Très bien noté");
          }
        }

        // Calculs pour affichage avec vraies données
        const distance = Math.floor(1 + Math.random() * (preferences?.delivery_radius || 10));

        // Récupérer la vraie note au lieu d'une note fictive
        const realRating = await getRealRating(restaurant.id);

        return {
          ...restaurant,
          score,
          rating: realRating,
          distance,
          reasons,
          analytics: analytics || {
            profile_views: 0,
            menu_views: 0,
            rating_count: 0,
            average_rating: realRating || 0
          }
        };
      }));

      const sortedRestaurants = scoredRestaurants
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setRecommendations(sortedRestaurants);
    } catch (error) {
      console.error('Erreur génération recommandations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    await trackInteraction(restaurant.id, 'profile_view');
    loadRestaurantMenus(restaurant.id);
  };

  const loadRestaurantMenus = async (restaurantId: string) => {
    try {
      setMenuLoading(true);
      await trackInteraction(restaurantId, 'menu_view');
      
      const { data: menus, error } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (error) throw error;
      setRestaurantMenus(menus || []);
    } catch (error) {
      console.error('Erreur chargement menus:', error);
      setRestaurantMenus([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleFavoriteToggle = async (restaurantId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggleFavorite(restaurantId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="text-xl font-semibold">Recommandations intelligentes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recommandé pour vous</h2>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Analyse temps réel
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((restaurant, index) => (
          <Card 
            key={restaurant.id} 
            className={`cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
              index === 0 ? 'border-primary' : ''
            }`}
            onClick={() => handleRestaurantClick(restaurant)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {restaurant.logo_url ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg line-clamp-1">{restaurant.name}</CardTitle>
                      {index === 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Top
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {restaurant.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleFavoriteToggle(restaurant.id, e)}
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isFavorite(restaurant.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`} 
                  />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats temps réel avec notation par étoiles */}
              <div className="flex items-center justify-between text-sm">
                {restaurant.rating ? (
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(restaurant.rating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-xs">({restaurant.rating})</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Pas d'évaluations</span>
                )}
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{restaurant.analytics?.profile_views || 0}</span>
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
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : ''
                    }`}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>

              {/* Raisons basées sur données réelles */}
              {restaurant.reasons && restaurant.reasons.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recommandé car
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.reasons.slice(0, 2).map((reason, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs"
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

      {/* Modal profil restaurant détaillé */}
      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {selectedRestaurant.logo_url ? (
                      <img 
                        src={selectedRestaurant.logo_url} 
                        alt={selectedRestaurant.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <DialogTitle className="text-2xl">{selectedRestaurant.name}</DialogTitle>
                      <p className="text-muted-foreground">{selectedRestaurant.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          <span className="font-medium">{Number(selectedRestaurant.rating).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({selectedRestaurant.analytics?.rating_count || 0} avis)
                          </span>
                        </div>
                        <Badge variant="outline">{selectedRestaurant.price_range}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleFavoriteToggle(selectedRestaurant.id, e)}
                  >
                    <Heart 
                      className={`h-5 w-5 ${
                        isFavorite(selectedRestaurant.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </Button>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Infos</TabsTrigger>
                  <TabsTrigger value="menus">Menus</TabsTrigger>
                  <TabsTrigger value="location">Localisation</TabsTrigger>
                  <TabsTrigger value="reviews">Avis</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Informations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedRestaurant.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedRestaurant.address}</span>
                          </div>
                        )}
                        {selectedRestaurant.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedRestaurant.phone}</span>
                          </div>
                        )}
                        {selectedRestaurant.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedRestaurant.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Livraison: {selectedRestaurant.delivery_time}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cuisines</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedRestaurant.cuisine_type?.map((cuisine, idx) => (
                            <Badge key={idx} variant="secondary">{cuisine}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Stats en temps réel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistiques temps réel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {selectedRestaurant.analytics?.profile_views || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Vues profil</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {selectedRestaurant.analytics?.menu_views || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Vues menus</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {Number(selectedRestaurant.analytics?.average_rating || 0).toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Note moyenne</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="menus" className="space-y-4">
                  {menuLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-32 bg-muted rounded mb-3"></div>
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : restaurantMenus.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {restaurantMenus.map((menu) => (
                        <Card key={menu.id}>
                          <CardContent className="p-4">
                            <img 
                              src={menu.image_url} 
                              alt={menu.description}
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                            <h4 className="font-semibold">{menu.cuisine_type}</h4>
                            <p className="text-sm text-muted-foreground">{menu.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <MenuIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun menu disponible</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <MapPin className="h-12 w-12 mx-auto mb-2" />
                          <p>Carte interactive à venir</p>
                          <p className="text-sm">{selectedRestaurant.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <RatingComponent restaurantId={selectedRestaurant.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {recommendations.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Aucune recommandation disponible
            </h3>
            <p className="text-sm text-muted-foreground">
              Configurez vos préférences pour recevoir des suggestions personnalisées
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};