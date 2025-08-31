import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferences {
  id?: string;
  user_id: string;
  cuisine_preferences: string[];
  dietary_restrictions: string[];
  allergens: string[];
  price_range: string;
  street?: string;
  delivery_radius: number;
  favorite_meal_times: string[];
  notification_preferences: {
    push: boolean;
    email: boolean;
  };
}

const defaultPreferences: Omit<UserPreferences, 'user_id'> = {
  cuisine_preferences: [],
  dietary_restrictions: [],
  allergens: [],
  price_range: "",
  street: "",
  delivery_radius: 1,
  favorite_meal_times: [],
  notification_preferences: {
    push: false,
    email: false
  }
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const initPreferences = async () => {
      await loadPreferences();
      
      // Synchronisation en temps réél des préférences utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const preferencesSubscription = supabase
          .channel('user-preferences-sync')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_preferences',
            filter: `user_id=eq.${session.user.id}`
          }, (payload) => {
            console.log('User preferences updated in real-time:', payload);
            if (payload.eventType === 'UPDATE' && payload.new) {
              setPreferences({
                ...payload.new as any,
                notification_preferences: payload.new.notification_preferences as any || {
                  push: false,
                  email: false
                }
              });
              // Notifier les composants que les préférences ont changé
              window.dispatchEvent(new CustomEvent('preferencesUpdated'));
            }
          })
          .subscribe();

        return () => {
          supabase.removeChannel(preferencesSubscription);
        };
      }
    };

    initPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      console.log('Loading preferences...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session) {
        console.log('No session found');
        return;
      }

      console.log('Session found, loading preferences for user:', session.user.id);

      // Retry logic for better connection handling
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single(); // Utiliser .single() maintenant qu'on a une contrainte unique

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
          }

          if (data) {
            console.log('Preferences loaded from database:', data);
            setPreferences({
              ...data,
              notification_preferences: data.notification_preferences as any || {
                push: false,
                email: false
              }
            });
          } else {
            console.log('No preferences found, creating default preferences...');
            // Create default preferences with upsert to avoid conflicts
            const newPreferences = {
              ...defaultPreferences,
              user_id: session.user.id
            };
            
            const { data: created, error: createError } = await supabase
              .from('user_preferences')
              .upsert(newPreferences, { onConflict: 'user_id' })
              .select()
              .single();

            if (createError) throw createError;
            console.log('Default preferences created:', created);
            setPreferences({
              ...created,
              notification_preferences: created.notification_preferences as any || {
                push: false,
                email: false
              }
            });
          }
          break;
        } catch (error) {
          console.error(`Preferences load error (attempt ${retryCount + 1}):`, error);
          if (retryCount === maxRetries - 1) {
            toast({
              title: "Problème de connexion",
              description: "Impossible de charger les préférences. Veuillez rafraîchir la page.",
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
      console.error('Critical error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('Updating preferences with:', updates);

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('id', preferences.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Preferences updated successfully:', data);

      // Update local state immediately
      const updatedPreferences = {
        ...data,
        notification_preferences: data.notification_preferences as any || {
          push: false,
          email: false
        }
      };
      
      setPreferences(updatedPreferences);
      
      console.log('💾 Emitting global preferences update event');
      window.dispatchEvent(new CustomEvent('preferencesUpdated', { 
        detail: { preferences: updatedPreferences } 
      }));
      
      toast({
        title: t('toasts.preferencesUpdated'),
        description: t('toasts.preferencesSavedSuccessfully')
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.preferencesUpdateError'),
        variant: "destructive"
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    loadPreferences
  };
};