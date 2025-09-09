import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Heart,
  Share2,
  Instagram,
  Facebook,
  Truck,
  Store,
  Utensils,
  X,
  ChefHat
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS, DIETARY_RESTRICTIONS_TRANSLATIONS, ALLERGENS_TRANSLATIONS } from "@/constants/cuisineTypes";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  description_fr?: string;
  description_en?: string;
  address?: string;
  phone?: string;
  email?: string;
  cuisine_type?: string[];
  service_types?: string[];
  dietary_restrictions?: string[];
  allergens?: string[];
  restaurant_specialties?: string[];
  price_range?: string;
  logo_url?: string;
  cover_image_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  opening_hours?: any;
  delivery_radius?: number;
  is_active: boolean;
}

interface ConsumerRestaurantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

export const ConsumerRestaurantProfileModal = ({ 
  open, 
  onOpenChange, 
  restaurant 
}: ConsumerRestaurantProfileModalProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    if (restaurant && open) {
      checkIfFavorite();
      loadRatings();
    }
  }, [restaurant, open]);

  const checkIfFavorite = async () => {
    if (!restaurant) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('restaurant_id', restaurant.id)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      // Not a favorite or not logged in
      setIsFavorite(false);
    }
  };

  const loadRatings = async () => {
    if (!restaurant) return;

    try {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('restaurant_id', restaurant.id);

      if (ratings && ratings.length > 0) {
        const total = ratings.length;
        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / total;
        setAverageRating(Math.round(average * 10) / 10);
        setTotalRatings(total);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!restaurant) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: t('auth.loginRequired'),
          description: t('auth.loginToAddFavorites'),
          variant: "destructive"
        });
        return;
      }

      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('restaurant_id', restaurant.id);
        
        setIsFavorite(false);
        toast({
          title: t('favorites.removed'),
          description: t('favorites.removedFromFavorites')
        });
      } else {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: session.user.id,
            restaurant_id: restaurant.id
          });
        
        setIsFavorite(true);
        toast({
          title: t('favorites.added'),
          description: t('favorites.addedToFavorites')
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.tryAgain'),
        variant: "destructive"
      });
    }
  };

  const shareRestaurant = async () => {
    if (!restaurant) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: restaurant.name,
          text: restaurant.description || `Découvrez ${restaurant.name} sur Cuizly`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: t('share.copied'),
          description: t('share.linkCopied')
        });
      }
    } catch (error) {
      // User cancelled or error
    }
  };

  const getDescription = (restaurant: Restaurant) => {
    if (i18n.language === 'en') {
      return restaurant.description_en || restaurant.description_fr || restaurant.description;
    }
    return restaurant.description_fr || restaurant.description;
  };

  const formatTime = (time: string) => {
    return time || '--:--';
  };

  const getDayName = (day: string) => {
    const days = {
      monday: t('days.monday'),
      tuesday: t('days.tuesday'),
      wednesday: t('days.wednesday'),
      thursday: t('days.thursday'),
      friday: t('days.friday'),
      saturday: t('days.saturday'),
      sunday: t('days.sunday')
    };
    return days[day as keyof typeof days] || day;
  };

  if (!restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header with Cover Image */}
        <div className="relative">
          <div className="h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
            {restaurant.cover_image_url ? (
              <img 
                src={restaurant.cover_image_url} 
                alt="Photo de couverture"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Restaurant Info Overlay */}
          <div className="absolute -bottom-16 left-6 flex items-end space-x-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-background border-4 border-background rounded-xl shadow-lg overflow-hidden">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt="Logo restaurant"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {restaurant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="pb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-background drop-shadow-lg">
                {restaurant.name}
              </h1>
              {averageRating > 0 && (
                <div className="flex items-center space-x-1 text-background drop-shadow-lg">
                  <Star className="h-5 w-5 fill-current text-yellow-400" />
                  <span className="font-semibold">{averageRating}</span>
                  <span className="text-sm">({totalRatings} {t('ratings.reviews')})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFavorite}
              className={isFavorite ? "text-red-500 border-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? t('favorites.remove') : t('favorites.add')}
            </Button>
            <Button variant="outline" size="sm" onClick={shareRestaurant}>
              <Share2 className="h-4 w-4 mr-2" />
              {t('share.share')}
            </Button>
          </div>

          {/* Description */}
          {getDescription(restaurant) && (
            <Card>
              <CardContent className="p-4">
                <p className="text-foreground leading-relaxed">
                  {getDescription(restaurant)}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    {t('restaurant.contact')}
                  </h3>
                  
                  {restaurant.address && (
                    <div className="flex items-start space-x-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{restaurant.address}</span>
                    </div>
                  )}
                  
                  {restaurant.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${restaurant.phone}`} className="text-primary hover:underline">
                        {restaurant.phone}
                      </a>
                    </div>
                  )}
                  
                  {restaurant.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${restaurant.email}`} className="text-primary hover:underline">
                        {restaurant.email}
                      </a>
                    </div>
                  )}

                  {/* Social Media */}
                  {(restaurant.instagram_url || restaurant.facebook_url) && (
                    <div>
                      <Separator className="my-3" />
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">{t('restaurant.socialMedia')}</span>
                        <div className="flex space-x-2">
                          {restaurant.instagram_url && (
                            <a 
                              href={restaurant.instagram_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg transition-all duration-200"
                            >
                              <Instagram size={16} />
                            </a>
                          )}
                          {restaurant.facebook_url && (
                            <a 
                              href={restaurant.facebook_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                            >
                              <Facebook size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cuisine Types */}
              {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Utensils className="h-5 w-5 mr-2" />
                      {t('restaurant.cuisineType')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisine_type.map((cuisine, index) => (
                        <Badge key={index} variant="outline">
                          {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Types */}
              {restaurant.service_types && restaurant.service_types.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      {t('restaurant.serviceTypes')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.service_types.map((service, index) => (
                        <Badge key={index} variant="secondary">
                          {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Opening Hours */}
              {restaurant.opening_hours && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      {t('restaurant.openingHours')}
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between items-center text-sm">
                          <span className="font-medium capitalize">{getDayName(day)}</span>
                          <span className={hours.closed ? 'text-muted-foreground' : ''}>
                            {hours.closed ? t('restaurant.closed') : `${formatTime(hours.open)} - ${formatTime(hours.close)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Specialties */}
              {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      {t('restaurant.specialties')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.restaurant_specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="rounded-full">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dietary Info */}
              {((restaurant.dietary_restrictions && restaurant.dietary_restrictions.length > 0) || 
                (restaurant.allergens && restaurant.allergens.length > 0)) && (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">
                      {t('restaurant.dietaryInfo')}
                    </h3>
                    
                    {restaurant.dietary_restrictions && restaurant.dietary_restrictions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          {t('restaurant.dietaryRestrictions')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.dietary_restrictions.map((restriction, index) => (
                            <Badge key={index} variant="secondary">
                              {DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {restaurant.allergens && restaurant.allergens.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          {t('restaurant.allergens')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.allergens.map((allergen, index) => (
                            <Badge key={index} variant="destructive">
                              {ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Action Buttons at Bottom */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button className="flex-1" size="lg">
              <Utensils className="h-5 w-5 mr-2" />
              {t('restaurant.orderNow')}
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="h-5 w-5 mr-2" />
              {t('restaurant.call')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};