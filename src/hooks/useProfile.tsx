import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UserProfile {
  id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  username?: string;
  chef_emoji_color?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    
    // Set up real-time subscription for profile changes
    let channel: RealtimeChannel | null = null;
    
    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('Profile change received:', payload);
            if (payload.eventType === 'UPDATE' && payload.new) {
              setProfile(payload.new as UserProfile);
            } else if (payload.eventType === 'INSERT' && payload.new) {
              setProfile(payload.new as UserProfile);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
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
        throw new Error('Aucune session active');
      }

      console.log('📤 Attempting to upsert profile for user:', session.user.id);
      console.log('📝 Data to upsert:', { user_id: session.user.id, ...updates });

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: session.user.id,
          ...updates
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
        description: "Vos informations ont été sauvegardées"
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
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