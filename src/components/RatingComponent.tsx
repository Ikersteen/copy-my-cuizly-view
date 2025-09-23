import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";  
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface RatingComponentProps {
  restaurantId: string;
  showAddRating?: boolean;
}

export const RatingComponent = ({ restaurantId, showAddRating = true }: RatingComponentProps) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles (display_name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRatings(data);
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length || 0;
        setAverageRating(avg);
        setTotalRatings(data.length);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        const { data } = await supabase
          .from('ratings')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('user_id', user.id)
          .single();
        setUserRating(data);
      }
    };

    checkAuth();
    loadRatings();
  }, [restaurantId]);

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;

    setSubmitting(true);
    
    // Simple comment validation
    if (comment.length > 500) {
      toast({
        title: t('ratings.invalidComment'),
        description: t('ratings.commentTooLong'),
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ratings')
        .upsert({
          restaurant_id: restaurantId,
          user_id: user.id,
          rating: selectedRating,
          comment: comment || null
        });

      if (!error) {
        setIsDialogOpen(false);
        setSelectedRating(0);
        setComment('');
        toast({
          title: t('ratings.published'),
          description: t('ratings.thankYouFeedback')
        });
        // Reload ratings
        loadRatings();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
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
      {/* Average Rating Display - Only show if there are ratings */}
      {totalRatings > 0 && (
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            {renderStars(Math.round(averageRating))}
            <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">
            ({totalRatings} {totalRatings === 1 ? t('ratings.evaluation') : t('ratings.evaluations')})
          </span>
          
          {showAddRating && isAuthenticated && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  {userRating ? t('ratings.modify') : t('ratings.rate')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {userRating ? t('ratings.modifyRating') : t('ratings.rateRestaurant')}
                  </DialogTitle>
                    <VisuallyHidden>
                      <DialogDescription>
                        {userRating ? t('restaurantProfile.modifyRating') : t('restaurantProfile.rateRestaurant')}
                      </DialogDescription>
                    </VisuallyHidden>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('ratings.rating')}</label>
                    {renderStars(selectedRating, 'lg', true)}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('ratings.optionalComment')}</label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('ratings.sharePlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('ratings.cancel')}
                    </Button>
                    <Button 
                      onClick={handleSubmitRating}
                      disabled={selectedRating === 0 || submitting}
                    >
                      {submitting ? t('ratings.inProgress') : t('ratings.publish')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Existing Ratings */}
      {totalRatings > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">{t('ratings.customerReviews')}</h3>
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
                          {rating.profiles?.display_name || t('ratings.anonymousUser')}
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
