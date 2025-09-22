import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, Heart, Phone, Mail, ChefHat, MessageSquare, Instagram, Facebook, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { CommentModal } from "@/components/CommentModal";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { getTranslatedDescription } from "@/lib/translations";
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS } from "@/constants/cuisineTypes";

const RatingDisplay = ({ restaurantId }: { restaurantId: string }) => {
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

  if (!rating || totalRatings === 0) return null;

  return (
    <>
      <span className="text-muted-foreground">•</span>
      <div className="flex items-center space-x-1">
        <Star className="h-4 w-4 fill-current text-yellow-500" />
        <span className="text-sm font-medium">{rating}</span>
      </div>
    </>
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

export default function RestaurantMenu() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [menusLoading, setMenusLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      loadRestaurant();
      loadMenus();
    }
  }, [id]);

  const loadRestaurant = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_public_restaurants');

      if (error) throw error;
      
      const restaurant = data?.find(r => r.id === id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
      
      setRestaurant(restaurant);
    } catch (error) {
      console.error('Error loading restaurant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du restaurant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    if (!id) return;
    
    setMenusLoading(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('id, image_url, description, cuisine_type, is_active, dietary_restrictions, allergens')
        .eq('restaurant_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error(t('restaurantMenu.loadingError'), error);
    } finally {
      setMenusLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!restaurant?.id) return;
    
    try {
      await toggleFavorite(restaurant.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="space-y-2">
            <p className="text-cuizly-neutral font-medium">Chargement du restaurant...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cuizly-neutral mb-4">Restaurant introuvable</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="mb-4 text-cuizly-neutral hover:text-cuizly-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Restaurant Header Card */}
          <Card className="overflow-hidden shadow-xl">
            {/* Cover Image */}
            <div className="relative">
              {restaurant.cover_image_url ? (
                <div className="w-full h-48 sm:h-56 md:h-64 overflow-hidden">
                  <img
                    src={restaurant.cover_image_url}
                    alt={`${restaurant.name} - Photo de couverture`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-cuizly-primary/20 to-cuizly-secondary/20 flex items-center justify-center">
                  <ChefHat className="h-16 w-16 text-cuizly-primary/60" />
                </div>
              )}
            </div>
            
            {/* Restaurant Info Card */}
            <CardContent className="p-0">
              <div className="relative bg-background">                
                {/* Main info section */}
                <div className="p-6 flex items-start gap-6">
                  {/* Logo à gauche */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 border-4 border-border rounded-xl overflow-hidden bg-background shadow-lg">
                    {restaurant.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cuizly-primary/20 to-cuizly-secondary/20 flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-cuizly-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* Informations du restaurant */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      {restaurant.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          {restaurant.address}
                          {restaurant.price_range && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="font-medium">{restaurant.price_range}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <RatingDisplay restaurantId={restaurant.id} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Main Content */}
          <div className="bg-background rounded-lg mt-4 p-4 sm:p-6 space-y-6">
            {/* Description */}
            {(restaurant.description || restaurant.description_fr || restaurant.description_en) && (
              <p className="text-muted-foreground">
                {getTranslatedDescription(restaurant, currentLanguage)}
              </p>
            )}

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">
                  {t('restaurantMenu.details')}
                </TabsTrigger>
                <TabsTrigger value="menus">
                  {t('restaurantMenu.ourMenus')}
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Contact Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Delivery Time */}
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>{restaurant.delivery_radius ? `${restaurant.delivery_radius * 5}-${restaurant.delivery_radius * 8} min` : '25-40 min'}</span>
                    </div>
                    
                    {/* Opening Hours */}
                    {restaurant.opening_hours && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium mb-2">{t('restaurantMenu.openingHours')}</div>
                           <div className="space-y-1 text-sm text-muted-foreground">
                             {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                               const hours = restaurant.opening_hours[day];
                               if (!hours) return null;
                               return (
                                 <div key={day} className="flex justify-between">
                                   <span>{t(`restaurantMenu.days.${day}`)}: </span>
                                   <span>
                                     {typeof hours === 'object' && hours !== null ? 
                                       (hours as any).closed ? 
                                         t('restaurantMenu.closed') : 
                                         `${(hours as any).open || '00:00'}-${(hours as any).close || '23:59'}` 
                                       : hours as string}
                                   </span>
                                 </div>
                               );
                             })}
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
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span className="break-all">{restaurant.email}</span>
                      </div>
                    )}
                    
                    {/* Phone */}
                    {restaurant.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                    
                    {/* Social Media */}
                    {(restaurant.instagram_url || restaurant.facebook_url) && (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-3">
                          {restaurant.instagram_url && (
                            <a href={restaurant.instagram_url} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:scale-110 transition-transform">
                              <Instagram className="h-4 w-4 text-white" />
                            </a>
                          )}
                          {restaurant.facebook_url && (
                            <a href={restaurant.facebook_url} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center hover:scale-110 transition-transform">
                              <Facebook className="h-4 w-4 text-white" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Types de cuisines */}
                {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('restaurantMenu.cuisineTypes')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisine_type?.map((cuisine: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Types de service */}
                {restaurant.service_types && restaurant.service_types.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('restaurantMenu.serviceTypes')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.service_types?.map((service: string, index: number) => (
                        <Badge key={`service-${index}`} variant="outline">
                          {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[currentLanguage] || service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{t('restaurantMenu.specialties')}:</span> {restaurant.restaurant_specialties.join(' • ')}
                  </div>
                )}
              </TabsContent>

              {/* Menus Tab */}
              <TabsContent value="menus" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{t('restaurantMenu.ourMenus')}</h3>
                  {menus.length > 0 && (
                    <Badge variant="outline">{menus.length} menu{menus.length > 1 ? 's' : ''}</Badge>
                  )}
                </div>

                {menusLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                          <div className="h-4 bg-muted rounded w-20 mb-3"></div>
                          <div className="h-3 bg-muted rounded w-full mb-2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : menus.length === 0 ? (
                  <Card>
                     <CardContent className="p-12 text-center">
                       <h4 className="text-lg font-medium text-muted-foreground mb-3">
                         {t('restaurantMenu.noMenusAvailable')}
                       </h4>
                       <p className="text-muted-foreground">
                         {t('restaurantMenu.noMenusDescription')}
                       </p>
                     </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menus.map((menu) => (
                      <Card key={menu.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          {menu.image_url && (
                            <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                              <img
                                src={menu.image_url}
                                alt="Menu"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 items-start">
                              <Badge variant="outline">
                                {CUISINE_TRANSLATIONS[menu.cuisine_type as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || menu.cuisine_type}
                              </Badge>
                              <div className="flex flex-col gap-2 flex-1 min-w-0">
                                {menu.dietary_restrictions && menu.dietary_restrictions.length > 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">{t('menus.dietaryRestrictions')}</span> {menu.dietary_restrictions.join(', ')}
                                  </div>
                                )}
                                 {menu.allergens && menu.allergens.length > 0 && (
                                   <div className="text-sm text-muted-foreground">
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
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button 
                className="flex-1"
                onClick={() => setShowCommentModal(true)}
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('restaurantMenu.comment')}
              </Button>
              <Button 
                className="flex-1"
                onClick={handleToggleFavorite}
                variant={isFavorite(restaurant.id) ? "default" : "outline"}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite(restaurant.id) ? 'fill-current text-red-500' : 'text-red-500'}`} />
                {isFavorite(restaurant.id) ? t('restaurantMenu.removeFromFavorites') : t('restaurantMenu.addToFavorites')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CommentModal
        open={showCommentModal}
        onOpenChange={setShowCommentModal}
        restaurant={restaurant}
      />
    </div>
  );
}