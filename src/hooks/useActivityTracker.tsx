import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface ActivityEvent {
  event_type: string;
  event_data?: Record<string, any>;
  page_url: string;
  page_title?: string;
  referrer?: string;
  duration_seconds?: number;
}

export const useActivityTracker = () => {
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());
  const eventQueueRef = useRef<ActivityEvent[]>([]);
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Générer ou récupérer le session ID
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('cuizly_session_id');
    if (storedSessionId) {
      sessionIdRef.current = storedSessionId;
    } else {
      const newSessionId = uuidv4();
      sessionStorage.setItem('cuizly_session_id', newSessionId);
      sessionIdRef.current = newSessionId;
    }
  }, []);

  // Fonction pour ajouter un événement à la queue
  const queueEvent = useCallback((event: Omit<ActivityEvent, 'page_url'>) => {
    if (!sessionIdRef.current) return;

    const fullEvent: ActivityEvent = {
      ...event,
      page_url: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || undefined,
    };

    eventQueueRef.current.push(fullEvent);
  }, []);

  // Fonction pour envoyer les événements en batch
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0 || !sessionIdRef.current) return;

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      // Envoyer tous les événements en parallèle
      await Promise.all(
        eventsToSend.map(event =>
          supabase.rpc('log_user_activity', {
            p_session_id: sessionIdRef.current,
            p_event_type: event.event_type,
            p_event_data: event.event_data || {},
            p_page_url: event.page_url,
            p_page_title: event.page_title,
            p_referrer: event.referrer,
            p_duration_seconds: event.duration_seconds,
          })
        )
      );
    } catch (error) {
      console.error('Error logging activity:', error);
      // Remettre les événements dans la queue en cas d'erreur
      eventQueueRef.current.unshift(...eventsToSend);
    }
  }, []);

  // Tracker le changement de page
  useEffect(() => {
    const currentTime = Date.now();
    const duration = Math.floor((currentTime - pageStartTimeRef.current) / 1000);

    // Logger la durée sur la page précédente (si > 1 seconde)
    if (duration > 1) {
      queueEvent({
        event_type: 'page_exit',
        duration_seconds: duration,
      });
    }

    // Logger la nouvelle page
    queueEvent({
      event_type: 'page_view',
    });

    pageStartTimeRef.current = currentTime;
  }, [location.pathname, queueEvent]);

  // Tracker les clics sur les liens et boutons
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickedElement = target.closest('a, button, [role="button"]');

      if (clickedElement) {
        const elementType = clickedElement.tagName.toLowerCase();
        const elementText = clickedElement.textContent?.trim().substring(0, 100);
        const href = clickedElement.getAttribute('href');

        queueEvent({
          event_type: 'click',
          event_data: {
            element_type: elementType,
            element_text: elementText,
            href: href,
            x: e.clientX,
            y: e.clientY,
          },
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [queueEvent]);

  // Tracker le scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let maxScroll = 0;

    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        queueEvent({
          event_type: 'scroll',
          event_data: {
            max_scroll_percentage: maxScroll,
            current_scroll: scrollPercentage,
          },
        });
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [queueEvent]);

  // Flush périodique des événements (toutes les 30 secondes)
  useEffect(() => {
    flushIntervalRef.current = setInterval(flushEvents, 30000);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
  }, [flushEvents]);

  // Flush avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentTime = Date.now();
      const duration = Math.floor((currentTime - pageStartTimeRef.current) / 1000);

      if (duration > 1) {
        queueEvent({
          event_type: 'page_exit',
          duration_seconds: duration,
        });
      }

      // Flush synchrone avant de quitter
      if (eventQueueRef.current.length > 0) {
        const eventsToSend = [...eventQueueRef.current];
        
        // Utiliser sendBeacon avec l'URL complète
        const supabaseUrl = 'https://ffgkzvnbsdnfgmcxturx.supabase.co';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZ2t6dm5ic2RuZmdtY3h0dXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDU5NDksImV4cCI6MjA3MDk4MTk0OX0.VJZg2dWjtNydKV5RRRrl69XiOTv_1rya4IN5cI1MAzM';
        
        eventsToSend.forEach(event => {
          const blob = new Blob([JSON.stringify({
            p_session_id: sessionIdRef.current,
            p_event_type: event.event_type,
            p_event_data: event.event_data || {},
            p_page_url: event.page_url,
            p_page_title: event.page_title,
            p_referrer: event.referrer,
            p_duration_seconds: event.duration_seconds,
          })], { type: 'application/json' });
          
          navigator.sendBeacon(
            `${supabaseUrl}/rest/v1/rpc/log_user_activity`,
            blob
          );
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [queueEvent]);

  // Fonction publique pour tracker des événements custom
  const trackEvent = useCallback(
    (eventType: string, eventData?: Record<string, any>) => {
      queueEvent({
        event_type: eventType,
        event_data: eventData,
      });
    },
    [queueEvent]
  );

  return { trackEvent };
};
