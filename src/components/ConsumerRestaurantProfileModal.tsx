import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Phone, Mail, Share2, Instagram, Facebook, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: number;
  name: string;
  location: string;
  rating: number;
  cuisine: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  cuisine_types?: string[];
  service_types?: string[];
  specialties?: string[];
  opening_hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  instagram_url?: string;
  facebook_url?: string;
  cover_image_url?: string;
  logo_url?: string;
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
  const { t } = useTranslation();
  const { toast } = useToast();

  if (!restaurant) return null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: restaurant.name,
          text: `Découvrez ${restaurant.name} sur Cuizly`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien a été copié dans le presse-papiers",
        });
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const formatOpeningHours = (day: string) => {
    if (!restaurant.opening_hours?.[day]) return "Fermé";
    const hours = restaurant.opening_hours[day];
    if (hours.closed) return "Fermé";
    return `${hours.open} - ${hours.close}`;
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Cover Image with Share Button */}
        <div className="relative h-48 bg-gradient-to-r from-cuizly-primary to-cuizly-accent">
          {restaurant.cover_image_url && (
            <img 
              src={restaurant.cover_image_url} 
              alt="Couverture du restaurant"
              className="w-full h-full object-cover"
            />
          )}
          <Button
            onClick={handleShare}
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Partager
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            variant="ghost"
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Header with Logo and Basic Info */}
          <div className="flex items-center gap-4 mb-6">
            {restaurant.logo_url ? (
              <img 
                src={restaurant.logo_url} 
                alt="Logo du restaurant"
                className="w-16 h-16 rounded-full object-cover border-2 border-cuizly-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-cuizly-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-cuizly-primary">
                  {restaurant.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-cuizly-primary mb-1">
                {restaurant.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {restaurant.location}
                </div>
                <div className="flex items-center gap-1 bg-cuizly-accent/10 px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-cuizly-accent text-cuizly-accent" />
                  <span className="font-medium text-cuizly-accent">{restaurant.rating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {restaurant.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-cuizly-primary mb-2">Description</h3>
              <p className="text-muted-foreground">{restaurant.description}</p>
            </div>
          )}

          <Separator className="mb-6" />

          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-cuizly-primary mb-3">Contact</h3>
            <div className="space-y-2">
              {restaurant.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-cuizly-accent" />
                  <span>{restaurant.phone}</span>
                </div>
              )}
              {restaurant.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cuizly-accent" />
                  <span>{restaurant.email}</span>
                </div>
              )}
              {restaurant.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cuizly-accent" />
                  <span>{restaurant.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Networks */}
          {(restaurant.instagram_url || restaurant.facebook_url) && (
            <div className="mb-6">
              <h3 className="font-semibold text-cuizly-primary mb-3">Réseaux sociaux</h3>
              <div className="flex gap-2">
                {restaurant.instagram_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="p-2"
                  >
                    <a href={restaurant.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {restaurant.facebook_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="p-2"
                  >
                    <a href={restaurant.facebook_url} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          <Separator className="mb-6" />

          {/* Cuisine Types */}
          {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-cuizly-primary mb-3">Types de cuisine</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisine_types.map((cuisine, index) => (
                  <Badge key={index} variant="secondary">
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Service Types */}
          {restaurant.service_types && restaurant.service_types.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-cuizly-primary mb-3">Types de service</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.service_types.map((service, index) => (
                  <Badge key={index} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Specialties */}
          {restaurant.specialties && restaurant.specialties.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-cuizly-primary mb-3">Spécialité du restaurant</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {restaurant.opening_hours && (
            <div className="mb-6">
              <h3 className="font-semibold text-cuizly-primary mb-3">
                <Clock className="h-4 w-4 inline mr-2" />
                Heures d'ouverture
              </h3>
              <div className="space-y-2">
                {daysOfWeek.map(({ key, label }) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {formatOpeningHours(key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};