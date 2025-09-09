import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, MapPin, Heart, Phone, Mail, ChefHat, MessageSquare, Instagram, Facebook, Info, Menu, MessageCircle } from "lucide-react";
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden [&>button]:w-8 [&>button]:h-8 p-0 gap-0">
        <DialogTitle className="sr-only">{restaurant.name}</DialogTitle>
        
        {/* Facebook-style Header with Cover Photo and Logo */}
        <div className="relative">
          {/* Cover Photo Background */}
          <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            {restaurant.cover_image_url ? (
              <img 
                src={restaurant.cover_image_url} 
                alt="Photo de couverture"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <ChefHat className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
              </div>
            )}
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Logo and Restaurant Info Overlay */}
          <div className="absolute -bottom-4 sm:-bottom-6 left-3 sm:left-6 flex items-end gap-2 sm:gap-4 max-w-[calc(100%-6rem)]">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-2 sm:border-4 border-white shadow-lg sm:shadow-xl overflow-hidden bg-white">
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Name and Basic Info */}
            <div className="pb-1 sm:pb-2 text-white min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-0.5 sm:mb-1 truncate">{restaurant.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-white/90">
                <div className="flex items-center gap-2 flex-wrap">
                  {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                    <span className="truncate">{restaurant.cuisine_type.slice(0, 1).join(' • ')}</span>
                  )}
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <MapPin className="h-3 w-3" />
                    Montreal
                  </span>
                </div>
                {restaurant.price_range && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs w-fit">
                    {restaurant.price_range}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for the overlay */}
        <div className="h-6 sm:h-8"></div>
        
        {/* Content area with scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
            {/* Description - Only if exists */}
            {(restaurant.description || restaurant.description_fr || restaurant.description_en) && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslatedDescription(restaurant, currentLanguage)}
              </p>
            )}

            {/* Compact Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
                <TabsTrigger value="details" className="text-sm">
                  {t('restaurantMenu.details')}
                </TabsTrigger>
                <TabsTrigger value="menus" className="text-sm">
                  {t('restaurantMenu.ourMenus')}
                </TabsTrigger>
              </TabsList>

              {/* Details Tab - Responsive */}
              <TabsContent value="details" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                {/* Contact Info Grid - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-sm">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Delivery Time */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t('restaurantMenu.deliveryTime')}</div>
                        <div className="font-medium">{restaurant.delivery_radius ? `${restaurant.delivery_radius * 5}-${restaurant.delivery_radius * 8} min` : '25-40 min'}</div>
                      </div>
                    </div>
                    
                    {/* Opening Hours */}
                    {restaurant.opening_hours && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-2">{t('restaurantMenu.openingHours')}</div>
                          <div className="space-y-1">
                            {Object.entries(restaurant.opening_hours).slice(0, 3).map(([day, hours]) => (
                              <div key={day} className="flex justify-between text-xs">
                                <span className="capitalize text-muted-foreground">{t(`restaurantMenu.days.${day}`)}</span>
                                <span className="font-mono">
                                  {typeof hours === 'object' && hours !== null && !(hours as any).closed ? 
                                    `${(hours as any).open || '00:00'}-${(hours as any).close || '23:59'}` : 
                                    'Fermé'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Email */}
                    {restaurant.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">Email</div>
                          <div className="font-medium truncate">{restaurant.email}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Phone */}
                    {restaurant.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Téléphone</div>
                          <div className="font-medium">{restaurant.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Social Media */}
                    {(restaurant.instagram_url || restaurant.facebook_url) && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Info className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Réseaux sociaux</div>
                          <div className="flex gap-2">
                            {restaurant.instagram_url && (
                              <a href={restaurant.instagram_url} target="_blank" rel="noopener noreferrer"
                                 className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center transition-transform hover:scale-105">
                                <Instagram className="h-4 w-4 text-white" />
                              </a>
                            )}
                            {restaurant.facebook_url && (
                              <a href={restaurant.facebook_url} target="_blank" rel="noopener noreferrer"
                                 className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transition-transform hover:scale-105">
                                <Facebook className="h-4 w-4 text-white" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Separator */}
                <Separator className="my-4 sm:my-6" />

                {/* Types de cuisines */}
                {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      {t('restaurantMenu.cuisineTypes')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisine_type?.map((cuisine: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Types de service */}
                {restaurant.service_types && restaurant.service_types.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">{t('restaurantMenu.serviceTypes')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.service_types?.map((service: string, index: number) => (
                        <Badge key={`service-${index}`} variant="outline" className="text-xs">
                          {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[currentLanguage] || service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">{t('restaurantMenu.specialties')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.restaurant_specialties.join(' • ')}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Menus Tab - Responsive */}
              <TabsContent value="menus" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold">{t('restaurantMenu.ourMenus')}</h3>
                  {menus.length > 0 && (
                    <Badge variant="outline" className="text-xs">{menus.length} menu{menus.length > 1 ? 's' : ''}</Badge>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-3 sm:p-4">
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
                     <CardContent className="p-6 sm:p-8 text-center">
                       <h4 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                         {t('restaurantMenu.noMenusAvailable')}
                       </h4>
                       <p className="text-sm text-muted-foreground">
                         {t('restaurantMenu.noMenusDescription')}
                       </p>
                     </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {menus.map((menu) => (
                      <Card key={menu.id} className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-3 sm:p-4">
                          {menu.image_url && (
                            <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-50">
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
                            </div>
                            
                            <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                              {menu.description}
                            </p>
                            
                            {(menu.dietary_restrictions && menu.dietary_restrictions.length > 0) || 
                             (menu.allergens && menu.allergens.length > 0) && (
                              <div className="space-y-1 pt-2 border-t">
                                {menu.dietary_restrictions && menu.dietary_restrictions.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">{t('menus.dietaryRestrictions')}:</span> {menu.dietary_restrictions.join(', ')}
                                  </div>
                                )}
                                {menu.allergens && menu.allergens.length > 0 && (
                                  <div className="text-xs text-red-600 flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                                    <div>
                                      <span className="font-medium">{t('menus.allergens')}:</span> {menu.allergens.join(', ')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

            </Tabs>

            {/* Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <Button 
                className="w-full order-2 sm:order-1"
                onClick={() => setShowCommentModal(true)}
                variant="outline"
                size="lg"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('restaurantMenu.comment')}
              </Button>
              <Button 
                className="w-full order-1 sm:order-2"
                onClick={handleToggleFavorite}
                variant={isFavorite(restaurant.id) ? "default" : "outline"}
                size="lg"
              >
                <Heart className={`h-4 w-4 mr-2 transition-colors ${isFavorite(restaurant.id) ? 'fill-current text-red-500' : 'text-red-500'}`} />
                <span className="truncate">
                  {isFavorite(restaurant.id) ? t('restaurantMenu.removeFromFavorites') : t('restaurantMenu.addToFavorites')}
                </span>
              </Button>
            </div>
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