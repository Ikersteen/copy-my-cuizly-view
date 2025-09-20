import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Heart, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface GooglePlace {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  price_range: string;
  logo_url?: string;
  rating: number;
  is_open_now?: boolean;
  latitude?: number;
  longitude?: number;
  google_place_id: string;
  reasons: string[];
  source: "google_places";
}

interface GooglePlacesRecommendationsProps {
  userLatitude?: number;
  userLongitude?: number;
  radius?: number;
}

export const GooglePlacesRecommendations = ({ 
  userLatitude, 
  userLongitude, 
  radius = 5000 
}: GooglePlacesRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { t } = useTranslation();
  const { preferences } = useUserPreferences();

  useEffect(() => {
    if (userLatitude && userLongitude) {
      generateGooglePlacesRecommendations();
    }
  }, [userLatitude, userLongitude, preferences]);

  const generateGooglePlacesRecommendations = async () => {
    if (!userLatitude || !userLongitude) {
      toast({
        title: "Position requise",
        description: "Veuillez autoriser la géolocalisation pour obtenir des recommandations",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('google-places-recommendations', {
        body: {
          latitude: userLatitude,
          longitude: userLongitude,
          preferences: preferences,
          radius: radius
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      
      if (data.recommendations?.length === 0) {
        toast({
          title: "Aucun restaurant trouvé",
          description: "Essayez d'élargir votre zone de recherche ou modifiez vos préférences",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations Google Places:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations pour le moment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (placeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const isFavorite = favorites.has(placeId);

      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('restaurant_id', placeId);
        
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(placeId);
          return newFavorites;
        });
        
        toast({
          title: "Supprimé des favoris",
          description: "Ce restaurant a été retiré de vos favoris"
        });
      } else {
        // Add to favorites
        await supabase
          .from('user_favorites')
          .insert({
            user_id: session.user.id,
            restaurant_id: placeId
          });
        
        setFavorites(prev => new Set([...prev, placeId]));
        
        toast({
          title: "Ajouté aux favoris",
          description: "Ce restaurant a été ajouté à vos favoris"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris",
        variant: "destructive"
      });
    }
  };

  const openInGoogleMaps = (place: GooglePlace) => {
    const query = encodeURIComponent(`${place.name} ${place.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Recherche de restaurants à proximité...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Aucun restaurant trouvé à proximité avec vos critères.
        </p>
        <Button onClick={generateGooglePlacesRecommendations} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Restaurants à proximité</h3>
          <p className="text-sm text-muted-foreground">
            Découverts via Google Places • {recommendations.length} résultats
          </p>
        </div>
        <Button
          onClick={generateGooglePlacesRecommendations}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((place) => (
          <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {place.logo_url && (
              <div className="relative h-48 overflow-hidden">
                <img
                  src={place.logo_url}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant={favorites.has(place.id) ? "default" : "secondary"}
                    className="rounded-full h-8 w-8 p-0"
                    onClick={() => handleToggleFavorite(place.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favorites.has(place.id) ? "fill-current" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            )}

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base line-clamp-1">{place.name}</CardTitle>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{place.rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{place.address}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {place.cuisine_type.slice(0, 2).map((cuisine, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {cuisine}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {place.price_range}
                </Badge>
                {place.is_open_now && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Ouvert
                  </Badge>
                )}
              </div>

              {place.reasons && place.reasons.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Recommandé car:</p>
                  {place.reasons.slice(0, 2).map((reason, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      • {reason}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => openInGoogleMaps(place)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Voir sur Maps
                </Button>
                <Button
                  onClick={() => handleToggleFavorite(place.id)}
                  size="sm"
                  variant={favorites.has(place.id) ? "default" : "outline"}
                >
                  <Heart
                    className={`h-3 w-3 ${
                      favorites.has(place.id) ? "fill-current" : ""
                    }`}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};