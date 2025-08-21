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
  price_range: "$$",
  street: "",
  delivery_radius: 10,
  favorite_meal_times: [],
  notification_preferences: {
    push: true,
    email: true
  }
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          ...data,
          notification_preferences: data.notification_preferences as any || {
            push: true,
            email: true
          }
        });
      } else {
        // Create default preferences
        const newPreferences = {
          ...defaultPreferences,
          user_id: session.user.id
        };
        
        const { data: created, error: createError } = await supabase
          .from('user_preferences')
          .insert(newPreferences)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences({
          ...created,
          notification_preferences: created.notification_preferences as any || {
            push: true,
            email: true
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos préférences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('id', preferences.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences({
        ...data,
        notification_preferences: data.notification_preferences as any || {
          push: true,
          email: true
        }
      });
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences ont été sauvegardées avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
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