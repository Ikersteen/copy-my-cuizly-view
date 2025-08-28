import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, MapPin } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface FavoritesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
}

export const FavoritesModal = ({ open, onOpenChange, onRestaurantClick }: FavoritesModalProps) => {
  const { favorites, toggleFavorite } = useFavorites();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && favorites.length > 0) {
      loadFavoriteRestaurants();
    }
  }, [open, favorites]);

  const loadFavoriteRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_public_restaurants');

      if (error) throw error;
      setFavoriteRestaurants(data || []);
    } catch (error) {
      console.error('Error loading favorite restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (restaurantId: string) => {
    try {
      console.log(`Tracking profile view for restaurant ${restaurantId}`);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Utiliser upsert pour éviter les conflits de contrainte unique
      const { error } = await supabase
        .from('restaurant_analytics')
        .upsert({
          restaurant_id: restaurantId,
          date: today,
          profile_views: 1
        }, {
          onConflict: 'restaurant_id,date',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error tracking profile view:', error);
      } else {
        console.log('Profile view tracked successfully');
      }
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mes restaurants favoris</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : favoriteRestaurants.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun favori pour le moment</h3>
            <p className="text-muted-foreground">Ajoutez des restaurants à vos favoris pour les retrouver ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favoriteRestaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(restaurant.id)}
                    >
                      <Heart className="h-4 w-4 fill-current text-red-500" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{restaurant.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {restaurant.cuisine_type?.slice(0, 2).map((cuisine, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="secondary">{restaurant.price_range}</Badge>
                  </div>
                  <Button 
                    className="w-full mt-3" 
                    size="sm"
                    onClick={() => {
                      // Track profile view
                      trackProfileView(restaurant.id);
                      onRestaurantClick?.(restaurant);
                    }}
                  >
                    Voir le profil
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};