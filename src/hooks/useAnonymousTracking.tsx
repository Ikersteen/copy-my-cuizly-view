import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from './useUserLocation';

export const useAnonymousTracking = (pageName: string) => {
  const { location } = useUserLocation();

  useEffect(() => {
    const trackAnonymousVisit = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        // Ne tracker que les utilisateurs NON connectés
        if (session?.user) {
          return;
        }

        // Obtenir ou créer un ID de session anonyme
        let sessionId = localStorage.getItem('cuizly_anonymous_session_id');
        if (!sessionId) {
          sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          localStorage.setItem('cuizly_anonymous_session_id', sessionId);
        }

        // Enregistrer le tracking dans la base de données
        const { error } = await supabase.rpc('track_anonymous_location', {
          p_session_id: sessionId,
          p_page_accessed: pageName,
          p_latitude: location?.latitude || null,
          p_longitude: location?.longitude || null,
          p_city: location?.city || null,
          p_country: location?.country || 'Canada',
          p_metadata: {
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            referrer: document.referrer || null
          }
        });

        if (error) {
          console.error('Error tracking anonymous visit:', error);
        } else {
          console.log('Anonymous visit tracked successfully for:', pageName);
        }
      } catch (error) {
        console.error('Error in anonymous tracking:', error);
      }
    };

    trackAnonymousVisit();
  }, [pageName, location]);
};
