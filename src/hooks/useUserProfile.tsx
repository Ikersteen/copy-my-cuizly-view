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

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error) {
            setProfile(data || { user_type: 'consumer' });
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

  const updateUserType = async (newUserType: 'consumer' | 'restaurant_owner') => {
    if (!user) return { error: 'User not authenticated' };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          user_type: newUserType
        });
      
      if (error) {
        console.error('Error updating user type:', error);
        return { error: error.message };
      }
      
      // Update local state immediately
      setProfile({ user_type: newUserType });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating user type:', error);
      return { error: error.message };
    }
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isConsumer: profile?.user_type === 'consumer',
    isRestaurant: profile?.user_type === 'restaurant_owner',
    updateUserType
  };
};