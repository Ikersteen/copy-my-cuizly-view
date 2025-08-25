import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import LoadingSpinner from '@/components/LoadingSpinner';

/// <reference types="google.maps" />

interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: google.maps.places.PlacePhoto[];
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  apiKey: string;
  onRestaurantsLoaded?: (restaurants: Restaurant[]) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  center = { lat: 45.5017, lng: -73.5673 }, // Montréal coordinates
  zoom = 13,
  apiKey,
  onRestaurantsLoaded
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();

        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          setMap(mapInstance);

          // Search for restaurants in Montreal
          const service = new google.maps.places.PlacesService(mapInstance);
          
          const request = {
            location: center,
            radius: 5000, // 5km radius
            type: 'restaurant' as any,
          };

          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const restaurantData = results.map(place => ({
                place_id: place.place_id || '',
                name: place.name || '',
                vicinity: place.vicinity || '',
                rating: place.rating,
                price_level: place.price_level,
                types: place.types || [],
                geometry: {
                  location: {
                    lat: place.geometry?.location?.lat() || 0,
                    lng: place.geometry?.location?.lng() || 0,
                  }
                },
                photos: place.photos
              }));

              setRestaurants(restaurantData);
              onRestaurantsLoaded?.(restaurantData);

              // Add markers for restaurants
              restaurantData.forEach(restaurant => {
                const marker = new google.maps.Marker({
                  position: restaurant.geometry.location,
                  map: mapInstance,
                  title: restaurant.name,
                  icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/restaurant.png',
                    scaledSize: new google.maps.Size(32, 32)
                  }
                });

                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 10px; max-width: 250px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937;">${restaurant.name}</h3>
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${restaurant.vicinity}</p>
                      ${restaurant.rating ? `<p style="margin: 0; color: #f59e0b; font-size: 14px;">⭐ ${restaurant.rating}/5</p>` : ''}
                      ${restaurant.price_level ? `<p style="margin: 4px 0 0 0; color: #10b981; font-size: 14px;">${'€'.repeat(restaurant.price_level)}</p>` : ''}
                    </div>
                  `
                });

                marker.addListener('click', () => {
                  infoWindow.open(mapInstance, marker);
                });
              });

              setIsLoading(false);
            } else {
              setError('Erreur lors du chargement des restaurants');
              setIsLoading(false);
            }
          });
        }
      } catch (err) {
        setError('Erreur lors du chargement de la carte');
        setIsLoading(false);
        console.error('Map loading error:', err);
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom, onRestaurantsLoaded]);

  if (error) {
    return (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-muted-foreground text-sm">
            Vérifiez que votre clé API Google Maps est correctement configurée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner size="md" />
            <p className="text-muted-foreground">Chargement des restaurants...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {restaurants.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">
            {restaurants.length} restaurants trouvés
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;