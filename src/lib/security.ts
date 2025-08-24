import { supabase } from "@/integrations/supabase/client";

// Rate limiting utility (client-side)
const rateLimiter = new Map<string, number>();

export const isRateLimited = (key: string, maxAttempts: number = 5, windowMs: number = 900000): boolean => {
  const now = Date.now();
  const attempts = rateLimiter.get(key) || 0;
  
  if (attempts >= maxAttempts) {
    return true;
  }
  
  rateLimiter.set(key, attempts + 1);
  
  // Clear after window
  setTimeout(() => {
    rateLimiter.delete(key);
  }, windowMs);
  
  return false;
};

// Enhanced session validation
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // Check if session is still valid (not expired)
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      await supabase.auth.signOut();
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Secure file upload validation
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }
  
  return { isValid: true };
};