// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface Rating {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: {
    user_id?: string;
    display_name?: string;
    username?: string;
  };
}

export const useRatings = (restaurantId?: string) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchRatings = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // SÉCURITÉ: Utiliser la fonction sécurisée pour obtenir UNIQUEMENT les noms d'affichage
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(rating => rating.user_id))];
        const { data: publicNames, error: namesError } = await supabase
          .rpc('get_public_user_names', { user_ids: userIds });

        if (namesError) {
          console.error('Error fetching public names:', namesError);
          // Continuer sans les noms en cas d'erreur
        }

        // Combine the data with only public display names
        const ratingsWithProfiles = data.map(rating => ({
          ...rating,
          profiles: publicNames?.find(p => p.user_id === rating.user_id) || {
            user_id: rating.user_id,
            display_name: t('ratings.anonymousUser'),
            username: t('ratings.anonymous')
          }
        }));

        setRatings(ratingsWithProfiles);
      } else {
        setRatings([]);
      }
      
      // Calculate average rating
      if (data && data.length > 0) {
        const avg = data.reduce((sum, rating) => sum + rating.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalRatings(data.length);
      } else {
        setAverageRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.cannotLoadRatings'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRating = async (rating: number, comment?: string) => {
    if (!restaurantId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          restaurant_id: restaurantId,
          rating,
          comment,
        });

      if (error) throw error;

      toast({
        title: t('toasts.ratingAdded'),
        description: t('toasts.thankYouRating'),
      });

      fetchRatings(); // Refresh the ratings
      return true;
    } catch (error) {
      console.error('Error adding rating:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.cannotAddRating'),
        variant: "destructive",
      });
      return false;
    }
  };

  const getUserRating = async () => {
    if (!restaurantId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user rating:', error);
      return null;
    }
  };

  // Load initial ratings
  useEffect(() => {
    fetchRatings();
  }, [restaurantId]);

  // Set up real-time updates for ratings  
  useEffect(() => {
    if (!restaurantId) return;

    console.log('🔄 Setting up ratings real-time subscription for:', restaurantId);

    const ratingsChannel = supabase
      .channel(`ratings-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('⭐ Ratings updated in real-time:', payload);
          fetchRatings(); // Reload ratings when changed
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up ratings subscription');
      ratingsChannel.unsubscribe();
    };
  }, [restaurantId]);

  return {
    ratings,
    loading,
    averageRating,
    totalRatings,
    addRating,
    getUserRating,
    refetch: fetchRatings,
  };
};