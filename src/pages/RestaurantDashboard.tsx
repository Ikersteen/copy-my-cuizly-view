import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, MapPin, LogOut, Instagram, Facebook, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


import { OffersSection } from "@/components/OffersSection";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from 'react-i18next';
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS, DIETARY_RESTRICTIONS_TRANSLATIONS, ALLERGENS_TRANSLATIONS } from "@/constants/cuisineTypes";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    
    // Set up polling fallback immediately instead of relying on WebSocket
    const pollInterval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      // Check if we have a valid session with proper error handling
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Redirection avec navigate
        navigate('/auth');
        return;
      }

      if (!session?.user) {
        console.warn('No valid session found');
        navigate('/auth');
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
    } finally {
      setLoading(false);
    }
  };


  // handleActionClick function removed as no longer needed



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="xl" />
          <p className="text-muted-foreground">{t('loading.dashboard')}</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Cover Image Facebook-style */}
        {restaurant?.cover_image_url && (
          <div className="relative w-full mb-8">
            <div className="w-full h-32 sm:h-48 lg:h-56 rounded-xl overflow-hidden bg-muted">
              <img 
                src={restaurant.cover_image_url} 
                alt={t('restaurant.coverPhoto')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-4 sm:left-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background border-4 border-background rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                {restaurant?.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                      alt={t('restaurant.logo')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-foreground font-semibold text-lg sm:text-xl">
                    <UserIcon className="h-6 w-6" />
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`mb-8 ${restaurant?.cover_image_url ? 'mt-8' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className={`flex items-center ${restaurant?.cover_image_url ? 'ml-20 sm:ml-24' : 'space-x-4'}`}>
              {!restaurant?.cover_image_url && (
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                  {restaurant?.logo_url ? (
                    <img 
                      src={restaurant.logo_url} 
                      alt={t('restaurant.logo')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-foreground font-semibold text-lg">
                      <UserIcon className="h-6 w-6" />
                    </span>
                  )}
                </div>
              )}
              <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {restaurant?.name || t('restaurant.myRestaurant')}
                  </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  @{profile?.username || restaurant?.name?.toLowerCase().replace(/\s+/g, '') || 'restaurant'}
                </p>
                {restaurant?.address && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons section removed - functionality moved to mobile menu */}

        {/* Message de bienvenue */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('welcome.welcomeMessage')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('welcome.dashboardDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section des offres */}
        <OffersSection userType="restaurant" restaurantId={restaurant?.id} />

        {/* Section analytics */}
        <AnalyticsSection restaurantId={restaurant?.id} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* Restaurant Info */}
          <div className="lg:col-span-3">
            {restaurant && (
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{t('restaurant.information')}</CardTitle>
                  <CardDescription className="text-sm">
                    {t('restaurant.details')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('restaurant.name')}</p>
                      <p className="text-foreground text-sm sm:text-base font-medium">{restaurant.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('restaurant.address')}</p>
                      <p className="text-foreground text-sm">{restaurant.address || t('restaurant.notSpecifiedFeminine')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('restaurant.phone')}</p>
                      <p className="text-foreground text-sm">{restaurant.phone || t('restaurant.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('restaurant.email')}</p>
                      <p className="text-foreground text-sm">{restaurant.email || t('restaurant.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('restaurant.priceRange')}</p>
                      <p className="text-foreground text-sm">{restaurant.price_range || t('restaurant.notSpecifiedFeminine')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('restaurant.deliveryRadius')}</p>
                      <p className="text-foreground text-sm">{restaurant.delivery_radius ? `${restaurant.delivery_radius} km` : t('restaurant.notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurant.cuisineType')}</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.cuisine_type?.length > 0 ? (
                          restaurant.cuisine_type.map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('restaurant.notDefined')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurant.serviceTypes')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(restaurant as any).service_types?.length > 0 ? (
                          (restaurant as any).service_types.map((service: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || service}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('restaurant.notDefined')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurant.specialty')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(restaurant as any).restaurant_specialties?.length > 0 ? (
                          (restaurant as any).restaurant_specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs rounded-full">
                              {specialty}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('restaurant.notDefined')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Social Media Icons */}
                    {(restaurant.instagram_url || restaurant.facebook_url) && (
                      <div className="md:col-span-2">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurant.socialMedia')}</p>
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
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurant.dietaryRestrictions')}</p>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.dietary_restrictions.map((restriction, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {restaurant.allergens?.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('restaurant.allergens')}</p>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.allergens.map((allergen, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {restaurant.description && (
                    <div className="pt-4 border-t">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{i18n.language === 'fr' ? 'Description' : 'Description'}</p>
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