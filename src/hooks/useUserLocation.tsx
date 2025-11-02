import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  timestamp: Date;
}

export const useUserLocation = (trackOnMount: boolean = false) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocationFromIP = async () => {
    try {
      // Utiliser ipapi.co pour obtenir la localisation depuis l'IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        city: data.city || null,
        country: data.country_name || null,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return null;
    }
  };

  const trackUserLocation = async (pageName: string = 'unknown') => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // Essayer d'obtenir la position GPS d'abord
      let locationData: LocationData | null = null;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0
            });
          });

          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: null,
            country: null,
            timestamp: new Date()
          };
        } catch (geoError) {
          console.log('GPS not available, falling back to IP location');
        }
      }

      // Si pas de GPS, utiliser l'IP
      if (!locationData) {
        locationData = await getLocationFromIP();
      }

      if (locationData) {
        setLocation(locationData);

        // Enregistrer dans la base de données
        const { error: dbError } = await supabase
          .from('user_activity_logs')
          .insert([{
            user_id: userId,
            session_id: crypto.randomUUID(),
            event_type: 'page_visit',
            page_url: window.location.href,
            page_title: pageName,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent || null,
            event_data: {
              location: {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                city: locationData.city,
                country: locationData.country,
                timestamp: locationData.timestamp.toISOString()
              },
              screen_resolution: `${window.screen.width}x${window.screen.height}`,
              viewport_size: `${window.innerWidth}x${window.innerHeight}`,
              language: navigator.language,
              platform: navigator.platform
            }
          }]);

        if (dbError) {
          console.error('Error saving location to database:', dbError);
          setError('Failed to save location data');
        }
      }
    } catch (err) {
      console.error('Error tracking user location:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackOnMount) {
      trackUserLocation();
    }
  }, [trackOnMount]);

  return {
    location,
    error,
    isLoading,
    trackUserLocation
  };
};
