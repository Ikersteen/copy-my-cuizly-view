// @ts-nocheck
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { rating: number | null; totalRatings: number }>>({});

  useEffect(() => {
    if (open && favorites.length > 0) {
      loadFavoriteRestaurants();
    }
  }, [open, favorites]);

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

  const loadRestaurantRatings = async (restaurants: Restaurant[]) => {
    const ratingsPromises = restaurants.map(async (restaurant) => {
      const ratingData = await getRealRating(restaurant.id);
      return { id: restaurant.id, ...ratingData };
    });

    const allRatings = await Promise.all(ratingsPromises);
    const ratingsMap = allRatings.reduce((acc, rating) => {
      acc[rating.id] = { rating: rating.rating, totalRatings: rating.totalRatings };
      return acc;
    }, {} as Record<string, { rating: number | null; totalRatings: number }>);

    setRestaurantRatings(ratingsMap);
  };

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
      
      // Charger les évaluations pour ces restaurants
      if (favoriteRestaurantsData.length > 0) {
        await loadRestaurantRatings(favoriteRestaurantsData);
      }
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
                  <div className="space-y-0.5 mb-3">
                    <div className="text-sm text-muted-foreground">{restaurant.address}</div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      {restaurant.price_range && (
                        <span className="font-bold">{restaurant.price_range}</span>
                      )}
                      {(() => {
                        const currentRating = restaurantRatings[restaurant.id];
                        if (currentRating && currentRating.rating !== null) {
                          return (
                            <>
                              {restaurant.price_range && <span>•</span>}
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                  {currentRating.rating}
                                </span>
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.cuisine_type?.slice(0, 2).map((cuisine, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}
                      </Badge>
                    ))}
                  </div>
                    <Button 
                      className="w-full mt-3 h-10" 
                     onClick={() => {
                       // Track profile view
                       trackProfileView(restaurant.id);
                       // Navigate to restaurant page
                       navigate(`/restaurant/${restaurant.id}`);
                       onOpenChange(false);
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
    </Dialog>
  );
};