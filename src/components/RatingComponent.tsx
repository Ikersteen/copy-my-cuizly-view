import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRatings } from '@/hooks/useRatings';
import { supabase } from '@/integrations/supabase/client';
import { validateRatingComment } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';

interface RatingComponentProps {
  restaurantId: string;
  showAddRating?: boolean;
}

export const RatingComponent = ({ restaurantId, showAddRating = true }: RatingComponentProps) => {
  const { ratings, loading, averageRating, totalRatings, addRating, getUserRating } = useRatings(restaurantId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        const existingRating = await getUserRating();
        setUserRating(existingRating);
      }
    };

    checkAuth();
  }, [restaurantId]);

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;

    // Validate comment with enhanced security
    const commentValidation = validateRatingComment(comment);
    if (!commentValidation.isValid) {
      toast({
        title: "Commentaire invalide",
        description: commentValidation.error,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    const success = await addRating(selectedRating, commentValidation.sanitized);
    
    if (success) {
      setIsDialogOpen(false);
      setSelectedRating(0);
      setComment('');
      // Refresh user rating
      const updatedRating = await getUserRating();
      setUserRating(updatedRating);
      toast({
        title: "Évaluation publiée",
        description: "Merci pour votre avis!"
      });
    }
    
    setSubmitting(false);
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm', interactive = false) => {
    const starSize = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} cursor-${interactive ? 'pointer' : 'default'} transition-colors ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Average Rating Display */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        {totalRatings > 0 ? (
          <>
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">
              ({totalRatings} {totalRatings === 1 ? 'évaluation' : 'évaluations'})
            </span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 text-gray-300" />
              ))}
            </div>
            <span className="text-muted-foreground">Pas encore d'évaluations</span>
          </div>
        )}
        
        {showAddRating && isAuthenticated && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                {userRating ? 'Modifier mon avis' : 'Évaluer'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {userRating ? 'Modifier votre évaluation' : 'Évaluer ce restaurant'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Note</label>
                  {renderStars(selectedRating, 'lg', true)}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Commentaire (optionnel)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSubmitRating}
                    disabled={selectedRating === 0 || submitting}
                  >
                    {submitting ? 'En cours...' : 'Publier'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Existing Ratings */}
      {totalRatings > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Avis des clients</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-card rounded-lg p-4 border">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ratings.map((rating) => (
                <div key={rating.id} className="bg-card rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating)}
                      <span className="text-sm text-muted-foreground">
                        {rating.profiles?.first_name} {rating.profiles?.last_name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-muted-foreground">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
