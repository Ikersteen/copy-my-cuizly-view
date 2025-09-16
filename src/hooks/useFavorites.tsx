import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Wait a moment for authentication to stabilize then load once
    const timer = setTimeout(() => {
      loadFavorites();
    }, 500);

    // Remove polling to avoid multiple calls
    // const pollInterval = setInterval(() => {
    //   loadFavorites();
    // }, 30000);

    return () => {
      clearTimeout(timer);
      // clearInterval(pollInterval);
    };
  }, []);

  const loadFavorites = async () => {
    try {
      // console.log('Loading favorites...'); // Réduire les logs
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setFavorites([]);
        return;
      }
      
      if (!session) {
        console.log('No session found, skipping favorites load');
        setFavorites([]);
        return;
      }

      // console.log('Session found, loading favorites for user:', session.user.id);

      // Retry logic for better connection handling
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('restaurant_id')
            .eq('user_id', session.user.id);

          if (error) {
            console.error('Supabase error loading favorites:', error);
            throw error;
          }
          
          console.log('Favorites loaded successfully:', data);
          setFavorites(data?.map(f => f.restaurant_id) || []);
          break;
        } catch (error) {
          console.error(`Favorites load error (attempt ${retryCount + 1}):`, error);
          if (retryCount === maxRetries - 1) {
            // Silent failure for favorites as it's not critical
            console.log('Max retries reached, setting empty favorites');
            setFavorites([]);
          }
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error('Critical error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (restaurantId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const isFavorite = favorites.includes(restaurantId);

      // ✅ Mise à jour optimiste AVANT la requête
      if (isFavorite) {
        setFavorites(prev => prev.filter(id => id !== restaurantId));
      } else {
        setFavorites(prev => [...prev, restaurantId]);
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('restaurant_id', restaurantId);

        if (error) throw error;
        toast({ title: "Favoris supprimé" });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: session.user.id,
            restaurant_id: restaurantId
          });

        if (error) throw error;
        toast({ title: t('favorites.added') });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // ❌ En cas d'erreur, revenir à l'état précédent
      loadFavorites();
      toast({
        title: t('toasts.error'),
        description: t('toasts.cannotModifyFavorites'),
        variant: "destructive"
      });
    }
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite: (restaurantId: string) => favorites.includes(restaurantId)
  };
};