import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export const useGoogleAuthMobile = () => {
  const signInWithGoogle = async () => {
    try {
      // Initialize Google Auth on mobile
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.initialize();
      }

      // Sign in with Google
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser.authentication?.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Sign in to Supabase with the Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.authentication.idToken,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { data: null, error };
    }
  };

  return { signInWithGoogle };
};
