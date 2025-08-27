import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommentWithProfile {
  id: string;
  user_id: string;
  restaurant_id: string;
  comment_text?: string;
  rating?: number;
  images?: string[];
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

export const useComments = (restaurantId?: string) => {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const { toast } = useToast();

  const fetchComments = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Then get profiles for the comment authors
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, username')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(p => p.user_id === comment.user_id) || {
            first_name: 'Consommateur',
            last_name: '',
            username: ''
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
        title: "Erreur",
        description: "Impossible de charger les commentaires",
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
        .from('comments')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          comment_text: commentText || null,
          rating: rating || null,
          images: images || [],
        });

      if (error) throw error;

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès",
      });

      fetchComments(); // Refresh the comments
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
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
          table: 'comments',
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