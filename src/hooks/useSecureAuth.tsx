import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateSession, secureLogout } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: !!session,
        });

        // Handle auth events
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('last_activity');
        } else if (event === 'SIGNED_IN') {
          localStorage.setItem('last_activity', Math.floor(Date.now() / 1000).toString());
        }

        // Defer additional data fetching to prevent auth state callback deadlock
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            // Any additional user data fetching can go here
          }, 0);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const isValid = await validateSession();
          if (!isValid) {
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isAuthenticated: false,
            });
            return;
          }
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: !!session,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(async () => {
      const isValid = await validateSession();
      if (!isValid) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
        });
        toast({
          title: t('toasts.sessionExpired'),
          description: t('toasts.pleaseSignInAgain'),
          variant: "destructive",
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, toast]);

  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    await secureLogout();
    setAuthState({
      user: null,
      session: null,
      loading: false,
      isAuthenticated: false,
    });
  };

  return {
    ...authState,
    logout,
  };
};