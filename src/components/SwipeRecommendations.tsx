import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, RotateCcw, Star, MapPin, Sparkles, Eye } from 'lucide-react';
import { useSwipeRecommendations, SwipeableRestaurant } from '@/hooks/useSwipeRecommendations';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useFavorites } from '@/hooks/useFavorites';
import { RestaurantMenuModal } from './RestaurantMenuModal';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { getTranslatedDescription } from '@/lib/translations';
import { CUISINE_TRANSLATIONS } from '@/constants/cuisineTypes';
import LoadingSpinner from './LoadingSpinner';

export const SwipeRecommendations = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const { toggleFavorite } = useFavorites();
  const [selectedRestaurant, setSelectedRestaurant] = useState<SwipeableRestaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const {
    currentRestaurant,
    loading,
    remainingCount,
    swipeRight,
    swipeLeft,
    undoLastSwipe,
    loadRecommendations,
    markAsViewed,
    swipeHistory
  } = useSwipeRecommendations();

  // Charger les recommandations au démarrage
  useEffect(() => {
    if (preferences?.id) {
      loadRecommendations(preferences);
    }
  }, [preferences?.id, loadRecommendations]);

  // Animation de swipe
  const animateSwipe = async (direction: 'left' | 'right', action: () => Promise<void>) => {
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    // Attendre la fin de l'animation
    setTimeout(async () => {
      await action();
      setIsAnimating(false);
      setSwipeDirection(null);
    }, 300);
  };

  const handleSwipeRight = () => {
    if (!currentRestaurant || isAnimating) return;
    animateSwipe('right', () => swipeRight(currentRestaurant));
  };

  const handleSwipeLeft = () => {
    if (!currentRestaurant || isAnimating) return;
    animateSwipe('left', () => swipeLeft(currentRestaurant));
  };

  const handleViewProfile = async () => {
    if (!currentRestaurant) return;
    
    await markAsViewed(currentRestaurant);
    setSelectedRestaurant(currentRestaurant);
    setShowRestaurantModal(true);
  };

  const getCuisineTranslation = (cuisineKey: string) => {
    return CUISINE_TRANSLATIONS[cuisineKey as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisineKey;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <h3 className="text-xl font-semibold">Préparation de vos recommandations...</h3>
        </div>
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-center max-w-md">
          Notre IA analyse vos préférences et votre historique pour vous proposer les meilleurs restaurants
        </p>
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Plus de recommandations !</h3>
          <p className="text-muted-foreground max-w-md">
            Vous avez exploré tous nos restaurants. Revenez bientôt pour de nouvelles découvertes !
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={() => loadRecommendations(preferences)} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Nouvelles recommandations
          </Button>
          {swipeHistory.length > 0 && (
            <Button onClick={undoLastSwipe} variant="ghost">
              <RotateCcw className="h-4 w-4 mr-2" />
              Annuler le dernier choix
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      {/* Compteur de restaurants restants */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {remainingCount} restaurant{remainingCount > 1 ? 's' : ''} à découvrir
          </span>
        </div>
      </div>

      {/* Carte de restaurant swipeable */}
      <div className="relative">
        <Card 
          className={`
            overflow-hidden shadow-2xl border-0 transition-all duration-300 
            ${isAnimating ? 'scale-95' : 'scale-100'}
            ${swipeDirection === 'right' ? 'transform rotate-12 translate-x-32 opacity-50' : ''}
            ${swipeDirection === 'left' ? 'transform -rotate-12 -translate-x-32 opacity-50' : ''}
          `}
          style={{ aspectRatio: '3/4' }}
        >
          {/* Image de couverture */}
          <div className="relative h-64 overflow-hidden">
            {currentRestaurant.cover_image_url || currentRestaurant.logo_url ? (
              <img
                src={currentRestaurant.cover_image_url || currentRestaurant.logo_url}
                alt={currentRestaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary/60">
                  {currentRestaurant.name.charAt(0)}
                </span>
              </div>
            )}
            
            {/* Overlay avec score IA */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Score de compatibilité */}
            {currentRestaurant.score && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">{Math.round(currentRestaurant.score)}%</span>
              </div>
            )}
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Informations principales */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-bold leading-tight">{currentRestaurant.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Montréal</span>
                </div>
              </div>

              {/* Rating et prix */}
              <div className="flex items-center justify-between">
                {currentRestaurant.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{currentRestaurant.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({currentRestaurant.totalRatings})
                    </span>
                  </div>
                )}
                
                {currentRestaurant.price_range && (
                  <Badge variant="secondary" className="font-bold">
                    {currentRestaurant.price_range}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground line-clamp-3">
              {getTranslatedDescription(currentRestaurant, currentLanguage)}
            </p>

            {/* Types de cuisine */}
            <div className="flex flex-wrap gap-2">
              {currentRestaurant.cuisine_type?.slice(0, 3).map((cuisine, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {getCuisineTranslation(cuisine)}
                </Badge>
              ))}
            </div>

            {/* Raisons IA */}
            {currentRestaurant.ai_reasons && currentRestaurant.ai_reasons.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Recommandé pour vous</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentRestaurant.ai_reasons.slice(0, 2).map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bouton voir le profil */}
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={handleViewProfile}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir le profil complet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Boutons de swipe */}
      <div className="flex justify-center gap-6">
        <Button
          size="lg"
          variant="outline"
          className="rounded-full h-16 w-16 border-2 hover:border-red-500 hover:text-red-500 transition-colors"
          onClick={handleSwipeLeft}
          disabled={isAnimating}
        >
          <X className="h-8 w-8" />
        </Button>

        {swipeHistory.length > 0 && (
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full h-12 w-12"
            onClick={undoLastSwipe}
            disabled={isAnimating}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}

        <Button
          size="lg"
          className="rounded-full h-16 w-16 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-0"
          onClick={handleSwipeRight}
          disabled={isAnimating}
        >
          <Heart className="h-8 w-8 fill-white" />
        </Button>
      </div>

      {/* Indications pour l'utilisateur */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Swipez ou utilisez les boutons</p>
        <p>❌ = Pas intéressé • ❤️ = J'aime</p>
      </div>

      {/* Modal de profil de restaurant */}
      {selectedRestaurant && (
        <RestaurantMenuModal
          restaurant={selectedRestaurant}
          open={showRestaurantModal}
          onOpenChange={setShowRestaurantModal}
        />
      )}
    </div>
  );
};