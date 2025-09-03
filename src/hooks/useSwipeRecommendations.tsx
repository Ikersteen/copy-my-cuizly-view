import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SwipeableRestaurant {
  id: string;
  name: string;
  description: string;
  description_fr?: string;
  description_en?: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  logo_url?: string;
  cover_image_url?: string;
  score?: number;
  ai_reasons?: string[];
  rating?: number;
  totalRatings?: number;
}

export const useSwipeRecommendations = () => {
  const [recommendations, setRecommendations] = useState<SwipeableRestaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState<Array<{ restaurant: SwipeableRestaurant; action: 'like' | 'pass' }>>([]);
  const { toast } = useToast();

  // Enregistrer une interaction utilisateur
  const recordInteraction = async (
    restaurantId: string, 
    interactionType: 'swipe_right' | 'swipe_left' | 'favorite' | 'profile_view',
    restaurantData?: SwipeableRestaurant
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const contextData = restaurantData ? {
        cuisine_type: restaurantData.cuisine_type,
        price_range: restaurantData.price_range,
        score: restaurantData.score || 0,
        timestamp: new Date().toISOString()
      } : {};

      await supabase
        .from('user_restaurant_interactions')
        .upsert({
          user_id: user.id,
          restaurant_id: restaurantId,
          interaction_type: interactionType,
          context_data: contextData
        });

    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  // Swipe vers la droite (j'aime)
  const swipeRight = useCallback(async (restaurant: SwipeableRestaurant) => {
    await recordInteraction(restaurant.id, 'swipe_right', restaurant);
    
    setSwipeHistory(prev => [...prev, { restaurant, action: 'like' }]);
    setCurrentIndex(prev => prev + 1);
    
    toast({
      title: "❤️ Ajouté aux favoris !",
      description: `${restaurant.name} a été ajouté à vos recommandations personnalisées`,
      duration: 2000,
    });
  }, [toast]);

  // Swipe vers la gauche (pas intéressé)
  const swipeLeft = useCallback(async (restaurant: SwipeableRestaurant) => {
    await recordInteraction(restaurant.id, 'swipe_left', restaurant);
    
    setSwipeHistory(prev => [...prev, { restaurant, action: 'pass' }]);
    setCurrentIndex(prev => prev + 1);
  }, []);

  // Annuler le dernier swipe
  const undoLastSwipe = useCallback(async () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];
    
    // Supprimer l'interaction de la base de données
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const interactionType = lastAction.action === 'like' ? 'swipe_right' : 'swipe_left';
        await supabase
          .from('user_restaurant_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', lastAction.restaurant.id)
          .eq('interaction_type', interactionType);
      }
    } catch (error) {
      console.error('Error undoing interaction:', error);
    }

    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    
    toast({
      title: "↩️ Action annulée",
      description: `Votre choix pour ${lastAction.restaurant.name} a été annulé`,
      duration: 2000,
    });
  }, [swipeHistory, currentIndex, toast]);

  // Charger les recommandations avec l'IA améliorée
  const loadRecommendations = useCallback(async (preferences: any) => {
    setLoading(true);
    
    try {
      // Récupérer les restaurants
      const { data: restaurantsResponse } = await supabase.rpc('get_public_restaurants');
      const restaurantsData = restaurantsResponse || [];

      if (restaurantsData.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Récupérer l'historique des interactions pour l'apprentissage
      const { data: { user } } = await supabase.auth.getUser();
      let userInteractions = [];
      let learnedPreferences = {};

      if (user) {
        // Récupérer les interactions passées
        const { data: interactions } = await supabase
          .from('user_restaurant_interactions')
          .select('*')
          .eq('user_id', user.id);

        userInteractions = interactions || [];

        // Récupérer les préférences apprises
        const { data: learned } = await supabase
          .from('user_learned_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        learnedPreferences = learned || {};
      }

      // Filtrer les restaurants déjà vus récemment
      const recentInteractions = userInteractions
        .filter(i => new Date(i.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 jours
        .map(i => i.restaurant_id);

      const unseenRestaurants = restaurantsData.filter(r => !recentInteractions.includes(r.id));
      
      // Utiliser l'IA pour générer des recommandations personnalisées
      try {
        console.log('🤖 Génération des recommandations avec IA...');
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-recommendations', {
          body: {
            restaurants: unseenRestaurants.slice(0, 20),
            preferences: preferences,
            userId: user?.id,
            userInteractions: userInteractions,
            learnedPreferences: learnedPreferences
          }
        });

        if (!aiError && aiResult?.recommendations?.length > 0) {
          console.log('✅ Recommandations IA générées avec succès');
          
          // Ajouter les ratings réels
          const recommendationsWithRatings = await Promise.all(
            aiResult.recommendations.map(async (restaurant: any) => {
              const { data: ratingsData } = await supabase
                .from('comments')
                .select('rating')
                .eq('restaurant_id', restaurant.id)
                .not('rating', 'is', null);

              let averageRating = null;
              let totalRatings = 0;

              if (ratingsData && ratingsData.length > 0) {
                const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
                averageRating = Math.round((sum / ratingsData.length) * 10) / 10;
                totalRatings = ratingsData.length;
              }

              return {
                ...restaurant,
                rating: averageRating,
                totalRatings: totalRatings,
                ai_reasons: restaurant.ai_reasons || []
              };
            })
          );

          setRecommendations(recommendationsWithRatings);
          setCurrentIndex(0);
          setSwipeHistory([]);
        } else {
          // Fallback si l'IA n'est pas disponible
          console.log('🔄 Fallback vers recommandations traditionnelles');
          const fallbackRecommendations = unseenRestaurants.slice(0, 10);
          setRecommendations(fallbackRecommendations);
          setCurrentIndex(0);
          setSwipeHistory([]);
        }
      } catch (error) {
        console.error('Error generating recommendations:', error);
        // Fallback en cas d'erreur
        const fallbackRecommendations = unseenRestaurants.slice(0, 10);
        setRecommendations(fallbackRecommendations);
        setCurrentIndex(0);
        setSwipeHistory([]);
      }

    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Restaurant actuel à afficher
  const currentRestaurant = recommendations[currentIndex] || null;
  
  // Nombre de restaurants restants
  const remainingCount = recommendations.length - currentIndex;

  // Marquer comme vu (pour les vues de profil)
  const markAsViewed = useCallback(async (restaurant: SwipeableRestaurant) => {
    await recordInteraction(restaurant.id, 'profile_view', restaurant);
  }, []);

  return {
    recommendations,
    currentRestaurant,
    currentIndex,
    loading,
    swipeHistory,
    remainingCount,
    swipeRight,
    swipeLeft,
    undoLastSwipe,
    loadRecommendations,
    markAsViewed
  };
};