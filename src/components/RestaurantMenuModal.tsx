import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, Heart, Phone, Mail, ChefHat, MessageSquare, Instagram, Facebook, Info, Menu, MessageCircle, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { RatingComponent } from "@/components/RatingComponent";
import { CommentModal } from "@/components/CommentModal";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { getTranslatedDescription } from "@/lib/translations";
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS } from "@/constants/cuisineTypes";
import { openDirections } from "@/utils/mapUtils";

// Composant pour afficher l'évaluation avec le prix
const RatingDisplay = ({ restaurantId, priceRange, address }: { restaurantId: string; priceRange?: string; address?: string }) => {
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
    <div className="space-y-1">
      {/* Address on its own line */}
      {address && (
        <button 
          onClick={() => openDirections(address)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group w-full text-left"
        >
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="group-hover:underline">{address}</span>
        </button>
      )}
      {!address && <span className="text-sm text-muted-foreground">Montreal</span>}
      
      {/* Price range and rating on second line */}
      <div className="flex items-center space-x-1">
        {priceRange && (
          <Badge variant="secondary">
            {priceRange}
          </Badge>
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
        <DialogHeader className="space-y-3">
          {/* Minimal Header */}
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-bold truncate">{restaurant.name}</DialogTitle>
              <RatingDisplay restaurantId={restaurant.id} priceRange={restaurant.price_range} address={restaurant.address} />
            </div>
            {/* Retirer le petit coeur rouge - supprimé */}
          </div>
        </DialogHeader>
        
        {/* Cover Image */}
        {restaurant.cover_image_url && (
          <div className="aspect-video w-full rounded-lg overflow-hidden -mt-2">
            <img
              src={restaurant.cover_image_url}
              alt={`${restaurant.name} - Photo de couverture`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="space-y-4">
          {/* Description - Only if exists */}
          {(restaurant.description || restaurant.description_fr || restaurant.description_en) && (
            <p className="text-sm text-muted-foreground">
              {getTranslatedDescription(restaurant, currentLanguage)}
            </p>
          )}

          {/* Compact Tabs - Retirer l'onglet Avis */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="details" className="text-xs">
                {t('restaurantMenu.details')}
              </TabsTrigger>
              <TabsTrigger value="menus" className="text-xs">
                {t('restaurantMenu.ourMenus')}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab - Compact */}
            <TabsContent value="details" className="space-y-3 mt-3">
              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Left Column */}
                <div className="space-y-3">
                  {/* Opening Hours */}
                  {restaurant.opening_hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-xs">
                        <div className="font-medium text-foreground mb-1">{t('restaurantMenu.openingHours')}</div>
                         {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                           const hours = restaurant.opening_hours[day];
                           if (!hours) return null;
                           return (
                              <div key={day} className="text-muted-foreground">
                                <span>{t(`restaurantMenu.days.${day}`)}: </span>
                                <span>
                                 {typeof hours === 'object' && hours !== null ? 
                                   (hours as any).closed ? 
                                     t('restaurantMenu.closed') : 
                                     `${(hours as any).open || '00:00'} - ${(hours as any).close || '23:59'}` 
                                   : hours as string}
                               </span>
                             </div>
                           );
                         })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  {/* Email */}
                  {restaurant.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{restaurant.email}</span>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {restaurant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  
                  {/* Social Media */}
                  {(restaurant.instagram_url || restaurant.facebook_url) && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        {restaurant.instagram_url && (
                          <a href={restaurant.instagram_url} target="_blank" rel="noopener noreferrer"
                             className="w-6 h-6 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <Instagram className="h-3 w-3 text-white" />
                          </a>
                        )}
                        {restaurant.facebook_url && (
                          <a href={restaurant.facebook_url} target="_blank" rel="noopener noreferrer"
                             className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                            <Facebook className="h-3 w-3 text-white" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Types de cuisines - Avec titre */}
              {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Types de cuisine</h4>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.cuisine_type?.map((cuisine: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                        {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Types de service - Avec titre */}
              {restaurant.service_types && restaurant.service_types.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Types de service</h4>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.service_types?.map((service: string, index: number) => (
                      <Badge key={`service-${index}`} variant="outline" className="text-xs px-2 py-0.5">
                        {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[currentLanguage] || service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties */}
              {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{t('restaurantMenu.specialties')}:</span> {restaurant.restaurant_specialties.join(' • ')}
                </div>
              )}
            </TabsContent>

            {/* Menus Tab */}
            <TabsContent value="menus" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('restaurantMenu.ourMenus')}</h3>
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
                        {t('menus.noMenusAvailable')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t('menus.noMenusYet')}
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
                              alt={t('common.menu')}
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
            </TabsContent>

          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              className="w-full"
              onClick={() => setShowCommentModal(true)}
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('restaurantMenu.comment')}
            </Button>
            <Button 
              className="w-full"
              onClick={handleToggleFavorite}
              variant={isFavorite(restaurant.id) ? "default" : "outline"}
            >
              <Heart className={`h-4 w-4 mr-2 ${isFavorite(restaurant.id) ? 'fill-current text-red-500' : 'text-red-500'}`} />
              {isFavorite(restaurant.id) ? t('restaurantMenu.removeFromFavorites') : t('restaurantMenu.addToFavorites')}
            </Button>
          </div>
        </div>

        <CommentModal
          open={showCommentModal}
          onOpenChange={setShowCommentModal}
          restaurant={restaurant}
        />
      </DialogContent>
    </Dialog>
  );
};