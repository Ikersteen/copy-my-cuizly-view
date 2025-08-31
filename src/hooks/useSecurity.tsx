import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  detectSuspiciousActivity,
  auditSecurityEvent,
  secureSupabaseRequest,
  sanitizeInput,
  rateLimiter,
  validateFileUpload
} from '@/lib/securityMiddleware';
import { logSecurityEvent } from '@/lib/sentry';

export const useSecurity = () => {
  const location = useLocation();

  // Détecter l'activité suspecte au chargement de page
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const referer = document.referrer;
    
    // Détecter activité suspecte
    if (detectSuspiciousActivity(userAgent, referer)) {
      auditSecurityEvent('suspicious_page_access', {
        path: location.pathname,
        userAgent,
        referer,
      });
    }

    // Logger navigation normale
    logSecurityEvent('page_navigation', {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [location]);

  // Wrapper sécurisé pour les opérations Supabase
  const secureOperation = useCallback(
    async (
      operation: () => Promise<any>,
      context: { operation: string; table?: string; userContext?: any }
    ) => {
      return secureSupabaseRequest(operation, context);
    },
    []
  );

  // Validation et nettoyage des entrées
  const sanitize = useCallback((input: string): string => {
    return sanitizeInput(input);
  }, []);

  // Validation des uploads
  const validateFile = useCallback((file: File) => {
    return validateFileUpload(file);
  }, []);

  // Vérification du rate limit
  const checkRateLimit = useCallback((key: string, maxRequests = 30, windowMs = 60000): boolean => {
    return rateLimiter.isRateLimited(key, maxRequests, windowMs);
  }, []);

  // Logger événement de sécurité personnalisé
  const logEvent = useCallback((
    eventType: string, 
    details: Record<string, any>, 
    level: 'info' | 'warning' | 'error' = 'info'
  ) => {
    logSecurityEvent(eventType, details, level);
    
    // Si critique, aussi enregistrer en base
    if (level === 'error') {
      auditSecurityEvent(eventType, details);
    }
  }, []);

  return {
    secureOperation,
    sanitize,
    validateFile,
    checkRateLimit,
    logEvent,
  };
};