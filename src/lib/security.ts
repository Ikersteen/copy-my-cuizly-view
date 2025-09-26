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

// Enhanced session validation with timeout handling
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
    
    // Check for session timeout (8 hours of inactivity)
    const lastActivity = localStorage.getItem('last_activity');
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity);
      if (timeSinceActivity > 28800) { // 8 hours
        await supabase.auth.signOut();
        localStorage.removeItem('last_activity');
        return false;
      }
    }
    
    // Update last activity
    localStorage.setItem('last_activity', now.toString());
    
    return true;
  } catch {
    return false;
  }
};

// Enhanced logout with proper cleanup
export const secureLogout = async (): Promise<void> => {
  try {
    // Clear local storage
    localStorage.removeItem('last_activity');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear any cached data
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Force reload to clear state
    window.location.reload();
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