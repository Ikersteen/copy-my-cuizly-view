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
    if (!favLoading) {
      if (favorites.length > 0) {
        loadFavoriteRestaurants();
      } else {
        setFavoriteRestaurants([]);
        setLoading(false);
      }
    }
  }, [favorites, favLoading]);

  // Real-time subscription for restaurant updates
  useEffect(() => {
    if (favorites.length === 0) return;

    const channel = supabase
      .channel('saved-favorites-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurants',
        filter: `id=in.(${favorites.join(',')})`
      }, () => {
        loadFavoriteRestaurants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [favorites]);

  const loadFavoriteRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, description, cuisine_type, price_range, address, logo_url')
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
      <section className="py-8 bg-background">
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
    return (
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <h1 className="text-2xl font-bold mb-1">Vos restaurants favoris</h1>
              <p className="text-sm text-muted-foreground">
                Découvrez et retrouvez facilement vos restaurants préférés
              </p>
            </div>
          </div>
          <div className="text-center space-y-8">
            <div className="bg-muted/30 rounded-lg p-12 max-w-lg mx-auto">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <p className="text-lg text-muted-foreground mb-3">
                Votre liste de favoris est vide pour l'instant.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <h1 className="text-2xl font-bold mb-1">Vos restaurants favoris</h1>
            <p className="text-sm text-muted-foreground">
              Découvrez et retrouvez facilement vos restaurants préférés
            </p>
          </div>
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