import * as Sentry from "@sentry/react";
import { createBrowserRouter } from "react-router-dom";

// Configuration Sentry pour monitoring A+
export const initSentry = () => {
  Sentry.init({
    dsn: "https://YOUR_DSN@sentry.io/PROJECT_ID", // À remplacer par votre DSN
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filtrer les erreurs non critiques
    beforeSend(event) {
      // Ignorer les erreurs de réseau communes
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'NetworkError' || 
            error?.value?.includes('Failed to fetch') ||
            error?.value?.includes('Load failed')) {
          return null;
        }
      }
      return event;
    },

    // Tags personnalisés pour le contexte sécurité
    initialScope: {
      tags: {
        section: "security-monitoring",
        app: "cuizly"
      },
    },
  });
};

// Fonction pour logger les événements de sécurité
export const logSecurityEvent = (
  eventType: string, 
  details: Record<string, any>, 
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  Sentry.addBreadcrumb({
    category: 'security',
    message: eventType,
    level,
    data: details,
  });

  if (level === 'error') {
    Sentry.captureException(new Error(`Security event: ${eventType}`), {
      tags: { security_event: eventType },
      extra: details,
    });
  }
};

// Wrapper pour les erreurs critiques de sécurité
export const captureSecurityError = (error: Error, context: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: { 
      security_critical: true,
      component: context.component || 'unknown'
    },
    extra: context,
  });
};