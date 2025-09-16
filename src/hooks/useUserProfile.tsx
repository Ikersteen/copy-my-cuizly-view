import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  user_type: 'consumer' | 'restaurant_owner';
}

export const useUserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Set up real-time subscription for profile changes
    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile changed:', payload);
          // If this is the current user's profile, refresh it
          const currentUser = supabase.auth.getUser();
          currentUser.then(({ data: { user } }) => {
            if (user && payload.new.user_id === user.id) {
              console.log('Refreshing current user profile due to change');
              fetchProfile(user.id);
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', userId)
            .maybeSingle();

          console.log('Profile data:', data, 'Error:', error);
          
          if (!error) {
            const profileData = data || { user_type: 'consumer' };
            console.log('Setting profile to:', profileData);
            setProfile(profileData);
            setLoading(false);
            return;
          } else {
            console.error(`Profile fetch error (attempt ${retryCount + 1}):`, error);
            if (retryCount === maxRetries - 1) {
              // Default to consumer after all retries
              setProfile({ user_type: 'consumer' });
              setLoading(false);
            }
          }
        } catch (fetchError) {
          console.error(`Network error (attempt ${retryCount + 1}):`, fetchError);
          if (retryCount === maxRetries - 1) {
            setProfile({ user_type: 'consumer' });
            setLoading(false);
          }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Critical error in fetchProfile:', error);
      setProfile({ user_type: 'consumer' });
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user.id);
    }
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isConsumer: profile?.user_type === 'consumer',
    isRestaurant: profile?.user_type === 'restaurant_owner',
    refreshProfile
  };
};