import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useTranslation } from 'react-i18next';

export interface UserProfile {
  id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  username?: string;
  avatar_url?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
    
    // Use polling instead of WebSocket for better compatibility
    const pollInterval = setInterval(() => {
      loadProfile();
    }, 60000); // Refresh every minute

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session) {
        console.log('No session found');
        return;
      }

      // Retry logic for better connection handling
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          setProfile(data);
          break;
        } catch (error) {
          console.error(`Profile load error (attempt ${retryCount + 1}):`, error);
          if (retryCount === maxRetries - 1) {
      toast({
        title: t('errors.title'),
        description: t('errors.connectionProblem'),
        variant: "destructive"
      });
          }
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('Critical error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    console.log('🔄 updateProfile called with:', updates);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('👤 Session check:', session ? 'Session found' : 'No session');
      
      if (!session) {
        console.error('❌ No active session');
        throw new Error(t('errors.noActiveSession'));
      }

      console.log('📤 Attempting to upsert profile for user:', session.user.id);
      console.log('📝 Data to upsert:', { user_id: session.user.id, ...updates });

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: session.user.id,
          ...updates
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      console.log('📊 Supabase response - data:', data);
      console.log('📊 Supabase response - error:', error);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      // Update local state immediately
      setProfile(data);
      console.log('✅ Profile updated successfully:', data);

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      toast({
        title: t('errors.title'),
        description: t('profile.cannotSaveProfile'),
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    loadProfile
  };
};