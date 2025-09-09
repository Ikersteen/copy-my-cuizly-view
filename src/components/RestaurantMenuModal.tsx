import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Clock, MapPin, Heart, Phone, Mail, ChefHat, MessageSquare, Instagram, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { RatingComponent } from "@/components/RatingComponent";
import { CommentModal } from "@/components/CommentModal";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { getTranslatedDescription } from "@/lib/translations";
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS } from "@/constants/cuisineTypes";

// Composant pour afficher l'évaluation avec le prix
const RatingDisplay = ({ restaurantId, priceRange }: { restaurantId: string; priceRange?: string }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data } = await supabase
          .from('comments')
          .select('rating')
          .eq('restaurant_id', restaurantId)
          .not('rating', 'is', null);

        if (data && data.length > 0) {
          const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setRating(Math.round(average * 10) / 10);
          setTotalRatings(data.length);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };

    fetchRating();

    // Real-time updates
    const channel = supabase
      .channel(`rating-${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        fetchRating();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return (
    <div className="flex items-center space-x-1">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Montreal</span>
      {priceRange && (
        <>
          <span className="text-muted-foreground">•</span>
          <Badge variant="secondary">
            {priceRange}
          </Badge>
        </>
      )}
      {rating && totalRatings > 0 && (
        <>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </>
      )}
    </div>
  );
};

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type: string;
  is_active: boolean;
  dietary_restrictions?: string[];
  allergens?: string[];
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
  phone?: string;
  email?: string;
  logo_url?: string;
  cover_image_url?: string;
  rating?: number;
  delivery_time?: string;
  delivery_radius?: number;
  opening_hours?: any;
  service_types?: string[];
  restaurant_specialties?: string[];
  instagram_url?: string;
  facebook_url?: string;
}

interface RestaurantMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

export const RestaurantMenuModal = ({ 
  open, 
  onOpenChange, 
  restaurant 
}: RestaurantMenuModalProps) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const { toggleFavorite, isFavorite, favorites } = useFavorites();
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    if (open && restaurant?.id) {
      loadMenus();
    }
  }, [open, restaurant?.id]);

  const loadMenus = async () => {
    if (!restaurant?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('id, image_url, description, cuisine_type, is_active, dietary_restrictions, allergens')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error(t('restaurantMenu.loadingError'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!restaurant?.id) return;
    
    console.log('🔄 Toggling favorite for restaurant:', restaurant.id);
    console.log('📍 Current favorite status:', isFavorite(restaurant.id));
    
    try {
      await toggleFavorite(restaurant.id);
      console.log('✅ Toggle favorite completed');
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    }
  };

  if (!restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:w-8 [&>button]:h-8">
        <DialogHeader className="space-y-4">
          {/* Restaurant Cover */}
           <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
            {restaurant.cover_image_url && (
              <img 
                src={restaurant.cover_image_url} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            {restaurant.cover_image_url && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            )}
            
             {/* Restaurant Logo Only */}
             <div className="absolute bottom-4 left-4">
               {restaurant.logo_url ? (
                 <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                   <img 
                     src={restaurant.logo_url} 
                     alt={restaurant.name}
                     className="w-full h-full object-cover"
                   />
                 </div>
               ) : (
                 <div className="w-20 h-20 rounded-xl bg-white/90 flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
                   <ChefHat className="h-8 w-8 text-primary" />
                 </div>
               )}
             </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Restaurant Info */}
          <div className="space-y-4">
            {/* Restaurant Name and Info */}
            <div className="space-y-3">
              <span className="text-lg font-bold text-foreground block">{restaurant.name}</span>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {/* Delivery Time */}
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.delivery_radius ? `${restaurant.delivery_radius * 5}-${restaurant.delivery_radius * 8} min` : '25-40 min'}</span>
                </div>
                
                <RatingDisplay restaurantId={restaurant.id} priceRange={restaurant.price_range} />
              </div>
            </div>

            {/* Description */}
            {(restaurant.description || restaurant.description_fr || restaurant.description_en) && (
              <p className="text-muted-foreground whitespace-pre-line">
                {getTranslatedDescription(restaurant, currentLanguage)}
              </p>
            )}

            {/* Restaurant Details */}
            <div className="space-y-3">
              {/* Cuisine Types */}
              {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">{t('restaurantMenu.cuisineTypes')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine_type.map((cuisine: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Types */}
              {restaurant.service_types && restaurant.service_types.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">{t('restaurantMenu.serviceTypes')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.service_types.map((service: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[currentLanguage] || service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurant Specialties */}
              {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">{t('restaurantMenu.specialties')}</h4>
                  <div className="text-sm text-muted-foreground">
                    {restaurant.restaurant_specialties.join(' • ')}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">{t('restaurantMenu.contact')}</h4>
                
                <div className="space-y-2">
                  {restaurant.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.email}</span>
                    </div>
                  )}
                </div>

                {/* Opening Hours */}
                {restaurant.opening_hours && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-foreground">{t('restaurantMenu.openingHours')}</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(restaurant.opening_hours).map(([day, hours]) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}: {hours as string}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Media */}
                {(restaurant.instagram_url || restaurant.facebook_url) && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-foreground">{t('restaurantMenu.socialMedia')}</h5>
                    <div className="flex gap-3">
                      {restaurant.instagram_url && (
                        <a 
                          href={restaurant.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-80 transition-opacity"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {restaurant.facebook_url && (
                        <a 
                          href={restaurant.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:opacity-80 transition-opacity"
                        >
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          </div>

          <Separator />

          {/* Ratings Section */}
          <div className="space-y-4">
            <RatingComponent restaurantId={restaurant.id} showAddRating={true} />
          </div>


           {/* Menus Section */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{t('restaurantMenu.ourMenus')}</h3>
                {menus.length > 0 && (
                  <Badge variant="outline">{menus.length} menu{menus.length > 1 ? 's' : ''}</Badge>
                )}
              </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3"></div>
                      <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full mb-1"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : menus.length === 0 ? (
              <Card>
                 <CardContent className="p-8 text-center">
                   <h4 className="text-lg font-medium text-muted-foreground mb-2">
                     {t('restaurantMenu.noMenusAvailable')}
                   </h4>
                   <p className="text-sm text-muted-foreground">
                     {t('restaurantMenu.noMenusDescription')}
                   </p>
                 </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menus.map((menu) => (
                  <Card key={menu.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {menu.image_url && (
                        <div className="aspect-video mb-3 rounded-lg overflow-hidden">
                          <img
                            src={menu.image_url}
                            alt="Menu"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-start">
                          <Badge variant="outline" className="text-xs">
                            {CUISINE_TRANSLATIONS[menu.cuisine_type as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || menu.cuisine_type}
                          </Badge>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            {menu.dietary_restrictions && menu.dietary_restrictions.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">{t('menus.dietaryRestrictions')}</span> {menu.dietary_restrictions.join(', ')}
                              </div>
                            )}
                             {menu.allergens && menu.allergens.length > 0 && (
                               <div className="text-xs text-muted-foreground">
                                 <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                   <span className="font-medium">{t('menus.allergens')}</span> {menu.allergens.join(', ')}
                                 </div>
                               </div>
                             )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3">
                          {menu.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              className="w-full"
              onClick={() => setShowCommentModal(true)}
             >
               <MessageSquare className="h-4 w-4 mr-2" />
               {t('restaurantMenu.comment')}
             </Button>
            <Button className="w-full" variant="outline" onClick={handleToggleFavorite}>
              <Heart 
                className={`h-4 w-4 mr-2 ${isFavorite(restaurant.id) ? 'fill-current text-red-500' : ''}`} 
               />
               {isFavorite(restaurant.id) ? t('restaurantMenu.removeFromFavorites') : t('restaurantMenu.addToFavorites')}
             </Button>
          </div>
        </div>
      </DialogContent>

      {/* Comment Modal */}
      <CommentModal 
        open={showCommentModal}
        onOpenChange={setShowCommentModal}
        restaurant={restaurant}
      />
    </Dialog>
  );
};