import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Rating {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export const useRatings = (restaurantId?: string) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const { toast } = useToast();

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

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(rating => rating.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const ratingsWithProfiles = data.map(rating => ({
          ...rating,
          profiles: profilesData?.find(p => p.user_id === rating.user_id) || {
            first_name: 'Utilisateur',
            last_name: 'Anonyme'
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
        title: "Erreur",
        description: "Impossible de charger les évaluations",
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
        title: "Évaluation ajoutée",
        description: "Merci pour votre évaluation !",
      });

      fetchRatings(); // Refresh the ratings
      return true;
    } catch (error) {
      console.error('Error adding rating:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'évaluation",
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

  useEffect(() => {
    fetchRatings();
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