import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, MapPin, LogOut, Instagram, Facebook, User as UserIcon, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAddresses } from "@/hooks/useAddresses";


import { OffersSection } from "@/components/OffersSection";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { RestaurantReservationsSection } from "@/components/RestaurantReservationsSection";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from 'react-i18next';
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS, DIETARY_RESTRICTIONS_TRANSLATIONS, ALLERGENS_TRANSLATIONS } from "@/constants/cuisineTypes";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useLocalizedRoute } from "@/lib/routeTranslations";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  cuisine_type?: string[];
  dietary_restrictions?: string[];
  allergens?: string[];
  price_range?: string;
  opening_hours?: any;
  delivery_radius?: number;
  is_active: boolean;
  logo_url?: string;
  cover_image_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  created_at?: string;
  updated_at?: string;
}


const RestaurantDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  const { primaryAddress: restaurantAddress } = useAddresses('restaurant');
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Get localized routes
  const homeRoute = useLocalizedRoute('/');
  const authRoute = useLocalizedRoute('/auth');

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when component becomes visible again (e.g., after closing a modal)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadData = async () => {
    try {
      // Check if we have a valid session with proper error handling
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Redirection avec navigate
        navigate(authRoute);
        return;
      }

      if (!session?.user) {
        console.warn('No valid session found');
        navigate(authRoute);
        return;
      }

      setUser(session.user);

      // Get user's restaurant with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', session.user.id)
            .maybeSingle();

          if (!restaurantError && restaurantData) {
            setRestaurant(restaurantData);
            break;
          } else if (restaurantError) {
            console.error(`Erreur lors du chargement du restaurant (tentative ${retryCount + 1}):`, restaurantError);
            if (retryCount === maxRetries - 1) {
              // Show user-friendly error after all retries
        toast({
          title: t('errors.connectionProblem'),
          description: t('errors.unableToLoadRestaurantData'),
          variant: "destructive"
        });
            }
          }
        } catch (error) {
          console.error(`Network error (tentative ${retryCount + 1}):`, error);
          if (retryCount === maxRetries - 1) {
          toast({
            title: t('errors.connectionError'),
            description: t('errors.checkInternetConnection'),
            variant: "destructive"
          });
          }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      console.error('Erreur critique lors du chargement des données:', error);
      toast({
        title: t('errors.systemError'),
        description: t('errors.unexpectedError'),
        variant: "destructive"
      });
    }
  };


  // handleActionClick function removed as no longer needed



  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate(homeRoute);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Cover Image Section - Always visible */}
        <div className="relative w-full mb-8">
          <div className="w-full h-32 sm:h-48 lg:h-56 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
            {restaurant?.cover_image_url ? (
              <img 
                src={restaurant.cover_image_url} 
                alt="Image de couverture du restaurant"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground text-center">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t('dashboard.noCoverImage')}</p>
              </div>
            )}
          </div>
          <div className="absolute -bottom-8 left-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-background border-4 border-background rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
              {restaurant?.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt="Logo du restaurant"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Information Section - Between logo and welcome message */}
        <div className="mb-8 ml-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {restaurant?.name || t('restaurant.myRestaurant')}
            </h1>
            {profile?.username && (
              <p className="text-sm sm:text-base text-muted-foreground">
                @{profile.username}
              </p>
            )}
            {restaurantAddress?.formatted_address || restaurant?.address ? (
              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1 break-words">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="break-words">{restaurantAddress?.formatted_address || restaurant?.address}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Buttons section removed - functionality moved to mobile menu */}

        {/* Section des offres */}
        <OffersSection userType="restaurant" restaurantId={restaurant?.id} />

        {/* Section analytics */}
        <AnalyticsSection restaurantId={restaurant?.id} />
        
        {/* Section réservations */}
        {restaurant?.id && (
          <div className="mb-8">
            <RestaurantReservationsSection restaurantId={restaurant.id} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* Restaurant Info */}
          <div className="lg:col-span-3">
            {restaurant && (
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{t('restaurantInfo.title')}</CardTitle>
                  <CardDescription className="text-sm">
                    {t('restaurantInfo.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{t('restaurantProfile.restaurantName')}</p>
                      <p className="text-foreground text-sm sm:text-base font-medium">{restaurant.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{t('restaurantProfile.address')}</p>
                      <p className="text-foreground text-sm">
                        {restaurantAddress?.formatted_address || restaurant.address || t('restaurantInfo.notSpecified')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{t('restaurantProfile.phone')}</p>
                      <p className="text-foreground text-sm">{restaurant.phone || t('restaurantInfo.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{t('restaurantProfile.email')}</p>
                      <p className="text-foreground text-sm">{restaurant.email || t('restaurantInfo.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{t('restaurantProfile.priceRange')}</p>
                      <p className="text-foreground text-sm">{restaurant.price_range || t('restaurantInfo.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-2">{t('restaurantProfile.cuisineTypes')}</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.cuisine_type?.length > 0 ? (
                          restaurant.cuisine_type.map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || 
                               cuisine}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('restaurantInfo.notDefined')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-2">{t('restaurantProfile.serviceTypes')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(restaurant as any).service_types?.length > 0 ? (
                          (restaurant as any).service_types.map((service: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || 
                               service}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('restaurantInfo.notDefined')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-2">{t('restaurantProfile.specialties')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(restaurant as any).restaurant_specialties?.length > 0 ? (
                          (restaurant as any).restaurant_specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs rounded-full">
                              {specialty}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('restaurantInfo.notDefined')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Opening Hours */}
                    <div className="md:col-span-2">
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-2">{t('restaurantInfo.openingHours')}</p>
                      {restaurant.opening_hours ? (
                        <div className="space-y-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                            const hours = (restaurant.opening_hours as Record<string, any>)[day];
                            if (!hours) return null;
                            return (
                              <div key={day} className="text-sm text-foreground">
                                <span className="font-medium capitalize">{t(`restaurantInfo.days.${day}`)}</span>:{' '}
                                {hours.closed ? (
                                  <span className="text-muted-foreground">{t('restaurantInfo.closed')}</span>
                                ) : (
                                  <span className="text-muted-foreground">{hours.open} - {hours.close}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-foreground text-sm">{t('restaurantInfo.notSpecified')}</p>
                      )}
                    </div>
                    
                    {/* Social Media Icons */}
                    {(restaurant.instagram_url || restaurant.facebook_url) && (
                      <div className="md:col-span-2">
                        <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-2">{t('restaurantProfile.socialMedia')}</p>
                        <div className="flex items-center gap-3">
                          {restaurant.instagram_url && (
                            <a 
                              href={restaurant.instagram_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
                            >
                              <Instagram size={20} />
                            </a>
                          )}
                          {restaurant.facebook_url && (
                            <a 
                              href={restaurant.facebook_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
                            >
                              <Facebook size={20} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {restaurant.dietary_restrictions?.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurantProfile.dietaryRestrictions')}</p>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.dietary_restrictions.map((restriction, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.fr || 
                               DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.en || 
                               restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {restaurant.allergens?.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurantProfile.allergens')}</p>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.allergens.map((allergen, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.fr || 
                               ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.en || 
                               allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {restaurant.description && (
                    <div className="pt-4 border-t">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-foreground text-sm">{restaurant.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Modals removed - functionality moved to Header component */}

    </div>
  );
};

export default RestaurantDashboard;