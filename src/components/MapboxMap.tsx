import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

// Token public Mapbox - À remplacer par votre token
// Obtenez-le sur https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiY3Vpemx5IiwiYSI6ImNtNWZyYjN4YzBhdmUyanM5cTBrbHZqajcifQ.example';

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
}

interface MapboxMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onRestaurantsLoaded?: (restaurants: Restaurant[]) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  center = { lat: 45.5017, lng: -73.5673 }, // Montréal
  zoom = 13,
  onRestaurantsLoaded
}) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Initialiser la carte Mapbox
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.lng, center.lat],
        zoom: zoom,
        pitch: 45,
      });

      // Ajouter les contrôles de navigation
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Ajouter le contrôle de géolocalisation
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Ajouter le contrôle de plein écran
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoading(false);
        
        // Ici vous pourriez ajouter une recherche de restaurants
        // via une API (Foursquare, Yelp, ou votre propre backend)
        // Pour l'instant, on simule des données
        const mockRestaurants: Restaurant[] = [];
        
        onRestaurantsLoaded?.(mockRestaurants);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError(t('googleMap.mapError'));
        setIsLoading(false);
      });

    } catch (err) {
      setError(t('googleMap.mapError'));
      setIsLoading(false);
      console.error('Map initialization error:', err);
    }

    return () => {
      map.current?.remove();
    };
  }, [center.lat, center.lng, zoom, onRestaurantsLoaded, t]);

  if (error) {
    return (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-muted-foreground text-sm">
            {t('googleMap.apiKeyError')}
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
            <p className="text-muted-foreground">{t('googleMap.loadingRestaurants')}</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {restaurants.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">
            {restaurants.length} {t('googleMap.restaurantsFound')}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
