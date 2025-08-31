import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent, captureSecurityError } from './sentry';

interface SecurityConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  suspiciousPatterns: string[];
  blockedUserAgents: string[];
}

const SECURITY_CONFIG: SecurityConfig = {
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  suspiciousPatterns: [
    'script>',
    'javascript:',
    'onload=',
    'onerror=',
    '<iframe',
    'eval(',
    'setTimeout(',
    'setInterval(',
  ],
  blockedUserAgents: [
    'bot',
    'crawler',
    'scraper',
    'spider',
  ],
};

// Rate limiting côté client
class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();

  isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requestTimes = this.requests.get(key)!;
    
    // Nettoyer les anciennes requêtes
    const validRequests = requestTimes.filter(time => time > windowStart);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= maxRequests) {
      logSecurityEvent('rate_limit_exceeded', {
        key,
        requestCount: validRequests.length,
        maxRequests,
        windowMs,
      }, 'warning');
      return true;
    }
    
    // Ajouter la requête actuelle
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return false;
  }
}

export const rateLimiter = new ClientRateLimiter();

// Validation des entrées utilisateur
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Détecter les patterns suspects
  const suspiciousFound = SECURITY_CONFIG.suspiciousPatterns.some(pattern => 
    input.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (suspiciousFound) {
    logSecurityEvent('suspicious_input_detected', {
      input: input.substring(0, 100), // Limiter pour la sécurité
      patterns: SECURITY_CONFIG.suspiciousPatterns.filter(p => 
        input.toLowerCase().includes(p.toLowerCase())
      ),
    }, 'warning');
    
    // Nettoyer l'entrée
    let clean = input;
    SECURITY_CONFIG.suspiciousPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      clean = clean.replace(regex, '');
    });
    return clean.trim();
  }
  
  return input.trim();
};

// Middleware de sécurité pour les requêtes Supabase
export const secureSupabaseRequest = async <T>(
  operation: () => Promise<T>,
  context: { 
    operation: string; 
    table?: string; 
    userContext?: any;
  }
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    // Vérifier le rate limiting
    const userKey = context.userContext?.id || 'anonymous';
    const operationKey = `${userKey}:${context.operation}`;
    
    if (rateLimiter.isRateLimited(operationKey, 30, 60000)) {
      throw new Error('Rate limit exceeded for this operation');
    }
    
    // Exécuter l'opération
    const result = await operation();
    
    // Logger l'opération réussie
    logSecurityEvent('database_operation_success', {
      operation: context.operation,
      table: context.table,
      duration: Date.now() - startTime,
      userContext: context.userContext?.id ? 'authenticated' : 'anonymous',
    });
    
    return result;
    
  } catch (error) {
    // Logger l'erreur de sécurité
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logSecurityEvent('database_operation_failed', {
      operation: context.operation,
      table: context.table,
      error: errorMessage,
      duration: Date.now() - startTime,
      userContext: context.userContext?.id ? 'authenticated' : 'anonymous',
    }, 'error');
    
    captureSecurityError(
      error instanceof Error ? error : new Error(errorMessage),
      context
    );
    
    throw error;
  }
};

// Validation des uploads de fichiers
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (file.size > maxSize) {
    logSecurityEvent('file_upload_size_exceeded', {
      fileName: file.name,
      fileSize: file.size,
      maxSize,
    }, 'warning');
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    logSecurityEvent('file_upload_invalid_type', {
      fileName: file.name,
      fileType: file.type,
      allowedTypes,
    }, 'warning');
    return { isValid: false, error: 'File type not allowed' };
  }
  
  return { isValid: true };
};

// Détection des tentatives d'attaque
export const detectSuspiciousActivity = (
  userAgent?: string,
  referer?: string,
  ipAddress?: string
): boolean => {
  let suspicious = false;
  const reasons: string[] = [];
  
  // Vérifier user agent
  if (userAgent) {
    const isSuspiciousAgent = SECURITY_CONFIG.blockedUserAgents.some(blocked =>
      userAgent.toLowerCase().includes(blocked)
    );
    if (isSuspiciousAgent) {
      suspicious = true;
      reasons.push('suspicious_user_agent');
    }
  }
  
  // Vérifier referer suspect
  if (referer && (
    referer.includes('javascript:') ||
    referer.includes('<script') ||
    referer.includes('data:')
  )) {
    suspicious = true;
    reasons.push('suspicious_referer');
  }
  
  if (suspicious) {
    logSecurityEvent('suspicious_activity_detected', {
      userAgent,
      referer,
      ipAddress,
      reasons,
    }, 'warning');
  }
  
  return suspicious;
};

// Logger d'audit de sécurité
export const auditSecurityEvent = async (
  eventType: string,
  details: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.rpc('log_security_event', {
      p_user_id: user?.id || null,
      p_event_type: eventType,
      p_event_details: details,
      p_ip_address: null, // L'IP sera ajoutée côté serveur si nécessaire
      p_user_agent: navigator.userAgent,
    });
    
    logSecurityEvent('audit_logged', {
      eventType,
      userId: user?.id ? 'authenticated' : 'anonymous',
    });
    
  } catch (error) {
    console.error('Failed to log security audit:', error);
    captureSecurityError(
      error instanceof Error ? error : new Error('Audit logging failed'),
      { eventType, details }
    );
  }
};