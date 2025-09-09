import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Phone, Mail, Share2, Instagram, Facebook, Twitter, Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { getTranslatedDescription } from '@/lib/translations';
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS } from "@/constants/cuisineTypes";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  description_fr?: string;
  description_en?: string;
  location: string;
  rating: number;
  price_range?: string;
  cuisine_type: string[];
  service_types?: string[];
  restaurant_specialties?: string[];
  phone?: string;
  email?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  website_url?: string;
  opening_hours?: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  cover_image_url?: string;
  logo_url?: string;
}

interface ConsumerRestaurantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const ConsumerRestaurantProfileModal = ({ 
  open, 
  onOpenChange, 
  restaurant 
}: ConsumerRestaurantProfileModalProps) => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { toast } = useToast();

  if (!restaurant) return null;

  const handleShare = async () => {
    const shareData = {
      title: restaurant.name,
      text: `Découvrez ${restaurant.name} sur Cuizly`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien du restaurant a été copié dans le presse-papiers"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getCuisineTranslation = (cuisineKey: string) => {
    return CUISINE_TRANSLATIONS[cuisineKey as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisineKey;
  };

  const getServiceTypeTranslation = (serviceKey: string) => {
    return SERVICE_TYPES_TRANSLATIONS[serviceKey as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[currentLanguage] || serviceKey;
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  const getDayTranslation = (day: string) => {
    return t(`restaurantProfile.${day}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Cover Image with Share Button */}
          <div className="relative w-full h-48 bg-gradient-to-br from-cuizly-primary/20 to-cuizly-accent/20 overflow-hidden">
            {restaurant.cover_image_url ? (
              <img 
                src={restaurant.cover_image_url} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cuizly-primary/10 to-cuizly-accent/10" />
            )}
            
            {/* Share Button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute bottom-4 right-4 rounded-full shadow-lg"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>

          {/* Restaurant Logo */}
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-background shadow-lg overflow-hidden">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={`${restaurant.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-2xl">{restaurant.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 px-6 pb-6">
          {/* Restaurant Header Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-cuizly-primary">{restaurant.name}</h2>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{restaurant.location}</span>
                  {restaurant.price_range && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{restaurant.price_range}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center bg-cuizly-accent/10 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 fill-cuizly-accent text-cuizly-accent mr-1" />
                <span className="font-medium text-cuizly-accent">{restaurant.rating}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {(restaurant.description || restaurant.description_fr || restaurant.description_en) && (
            <div className="mb-6">
              <div className="text-sm">
                <p className="text-foreground leading-relaxed">
                  {getTranslatedDescription(restaurant, currentLanguage)}
                </p>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Types de cuisine */}
          {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Types de cuisine</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisine_type.map((cuisine, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {getCuisineTranslation(cuisine)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Types de service */}
          {restaurant.service_types && restaurant.service_types.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Types de service</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.service_types.map((serviceType, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {getServiceTypeTranslation(serviceType)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Spécialités du restaurant */}
          {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Spécialités du restaurant</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.restaurant_specialties.map((specialty, index) => (
                  <Badge key={index} variant="default" className="text-sm">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Heures d'ouverture */}
          {restaurant.opening_hours && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                <Clock className="h-5 w-5 inline mr-2" />
                Heures d'ouverture
              </h3>
              <div className="space-y-2">
                {DAYS_ORDER.map((day) => {
                  const hours = restaurant.opening_hours?.[day];
                  if (!hours) return null;
                  
                  return (
                    <div key={day} className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium capitalize">
                        {getDayTranslation(day)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {hours.closed ? (
                          'Fermé'
                        ) : (
                          `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-4">
            {restaurant.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                <a 
                  href={`tel:${restaurant.phone}`}
                  className="text-cuizly-primary hover:underline"
                >
                  {restaurant.phone}
                </a>
              </div>
            )}
            
            {restaurant.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                <a 
                  href={`mailto:${restaurant.email}`}
                  className="text-cuizly-primary hover:underline"
                >
                  {restaurant.email}
                </a>
              </div>
            )}
          </div>

          {/* Réseaux sociaux */}
          {(restaurant.instagram_url || restaurant.facebook_url || restaurant.twitter_url || restaurant.website_url) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Réseaux sociaux</h3>
              <div className="flex items-center space-x-4">
                {restaurant.instagram_url && (
                  <a 
                    href={restaurant.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    <Instagram className="h-5 w-5 mr-2" />
                    Instagram
                  </a>
                )}
                
                {restaurant.facebook_url && (
                  <a 
                    href={restaurant.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Facebook className="h-5 w-5 mr-2" />
                    Facebook
                  </a>
                )}
                
                {restaurant.twitter_url && (
                  <a 
                    href={restaurant.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <Twitter className="h-5 w-5 mr-2" />
                    Twitter
                  </a>
                )}
                
                {restaurant.website_url && (
                  <a 
                    href={restaurant.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    Site web
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};