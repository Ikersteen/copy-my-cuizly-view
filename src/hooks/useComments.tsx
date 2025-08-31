import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface CommentWithProfile {
  id: string;
  user_id: string;
  restaurant_id: string;
  comment_text?: string;
  rating?: number;
  images?: string[];
  created_at: string;
  profiles?: {
    user_id?: string;
    display_name?: string;
    username?: string;
  };
}

export const useComments = (restaurantId?: string) => {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchComments = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('Comments')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // SÉCURITÉ: Utiliser la fonction sécurisée pour obtenir UNIQUEMENT les noms d'affichage
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        const { data: publicNames, error: namesError } = await supabase
          .rpc('get_public_user_names', { user_ids: userIds });

        if (namesError) {
          console.error('Error fetching public names:', namesError);
          // Continuer sans les noms en cas d'erreur
        }

        // Combine the data with only public display names
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: publicNames?.find(p => p.user_id === comment.user_id) || {
            user_id: comment.user_id,
            display_name: 'Utilisateur anonyme',
            username: 'anonyme'
          }
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }

      setTotalComments(commentsData?.length || 0);
      
      // Calculate average rating from comments with ratings
      const ratingsData = commentsData?.filter(comment => comment.rating) || [];
      if (ratingsData.length > 0) {
        const avg = ratingsData.reduce((sum, comment) => sum + comment.rating!, 0) / ratingsData.length;
        setAverageRating(Math.round(avg * 10) / 10);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.cannotLoadComments'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (
    commentText?: string, 
    rating?: number, 
    images?: string[]
  ) => {
    if (!restaurantId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('Comments')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          comment_text: commentText || null,
          rating: rating || null,
          images: images || [],
        });

      if (error) throw error;

      toast({
        title: t('comments.added'),
        description: t('comments.addedSuccess'),
      });

      fetchComments(); // Refresh the comments
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.cannotAddComment'),
        variant: "destructive",
      });
      return false;
    }
  };

  // Set up hyper-reactive real-time updates for comments and ratings
  useEffect(() => {
    if (!restaurantId) return;

    console.log('🔄 Setting up hyper-reactive subscription for:', restaurantId);

    const realtimeChannel = supabase
      .channel(`restaurant-activity-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Comments',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('💬 Comments updated in real-time:', payload);
          fetchComments(); // Immediate reload on any comment change
        }
      )
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
          fetchComments(); // Reload to update average rating
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up hyper-reactive subscription');
      realtimeChannel.unsubscribe();
    };
  }, [restaurantId]);

  return {
    comments,
    loading,
    averageRating,
    totalComments,
    addComment,
    refetch: fetchComments,
  };
};