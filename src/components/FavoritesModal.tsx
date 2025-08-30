import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, MapPin } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantMenuModal } from "@/components/RestaurantMenuModal";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";

interface FavoritesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  description_fr?: string;
  description_en?: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  logo_url?: string;
  cover_image_url?: string;
  opening_hours?: any;
}

export const FavoritesModal = ({ open, onOpenChange }: FavoritesModalProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

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
      
      // Filtrer les restaurants qui sont dans les favoris
      const favoriteRestaurantsData = data?.filter(restaurant => 
        favorites.includes(restaurant.id)
      ) || [];
      
      setFavoriteRestaurants(favoriteRestaurantsData);
    } catch (error) {
      console.error('Error loading favorite restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (restaurantId: string) => {
    try {
      console.log(`Tracking profile view for restaurant ${restaurantId}`);
      
      // Utiliser la fonction database sécurisée
      const { error } = await supabase.rpc('track_profile_view', {
        p_restaurant_id: restaurantId
      });

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
          <DialogTitle>{t('favorites.title')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : favoriteRestaurants.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('favorites.noFavorites')}</h3>
            <p className="text-muted-foreground">{t('favorites.addFavorites')}</p>
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
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'en' 
                      ? (restaurant.description_en || restaurant.description_fr || restaurant.description)
                      : (restaurant.description_fr || restaurant.description)}
                  </p>
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
                      setSelectedRestaurant(restaurant);
                      setShowRestaurantModal(true);
                    }}
                  >
                    {t('favorites.viewProfile')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
      
      <RestaurantMenuModal 
        open={showRestaurantModal}
        onOpenChange={setShowRestaurantModal}
        restaurant={selectedRestaurant}
      />
    </Dialog>
  );
};