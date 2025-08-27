import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();

    // Set up real-time subscription for favorites changes
    const subscription = supabase
      .channel('user-favorites')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_favorites'
      }, () => {
        loadFavorites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('restaurant_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.restaurant_id) || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (restaurantId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const isFavorite = favorites.includes(restaurantId);

      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('restaurant_id', restaurantId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== restaurantId));
        toast({ title: "Retiré des favoris" });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: session.user.id,
            restaurant_id: restaurantId
          });

        if (error) throw error;
        setFavorites(prev => [...prev, restaurantId]);
        toast({ title: "Ajouté aux favoris" });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris",
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