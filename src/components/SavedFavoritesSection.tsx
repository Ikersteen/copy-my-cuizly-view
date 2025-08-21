import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Clock, ArrowRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  logo_url?: string;
}

export const SavedFavoritesSection = () => {
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!favLoading && favorites.length > 0) {
      loadFavoriteRestaurants();
    } else {
      setLoading(false);
    }
  }, [favorites, favLoading]);

  const loadFavoriteRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', favorites)
        .eq('is_active', true);

      if (error) throw error;
      setFavoriteRestaurants(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || favLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (favoriteRestaurants.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Vos restaurants favoris
              </h2>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {favoriteRestaurants.length} restaurant{favoriteRestaurants.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Retrouvez facilement vos endroits préférés
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteRestaurants.slice(0, 4).map((restaurant) => (
            <Card 
              key={restaurant.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {restaurant.logo_url ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden mb-3">
                        <img 
                          src={restaurant.logo_url} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <span className="text-primary font-semibold text-lg">
                          {restaurant.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {restaurant.description || "Restaurant de qualité"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(restaurant.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="h-4 w-4 text-primary fill-current" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>4.{Math.floor(Math.random() * 5) + 3}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{15 + Math.floor(Math.random() * 30)} min</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {restaurant.cuisine_type?.slice(0, 2).map((cuisine, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cuisine}
                    </Badge>
                  ))}
                  {restaurant.price_range && (
                    <Badge variant="secondary" className="text-xs">
                      {restaurant.price_range}
                    </Badge>
                  )}
                </div>

                {restaurant.address && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{restaurant.address}</span>
                  </div>
                )}

                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  size="sm"
                >
                  Commander
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {favoriteRestaurants.length > 4 && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="group">
              Voir tous mes favoris
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};