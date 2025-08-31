import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Camera, X, Send, User } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useComments } from "@/hooks/useComments";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
}

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

export const CommentModal = ({ open, onOpenChange, restaurant }: CommentModalProps) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const { comments, loading, averageRating, totalComments, addComment } = useComments(restaurant?.id);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast({
        title: t('comments.limitReached'),
        description: t('comments.maxImages'),
        variant: "destructive"
      });
      return;
    }
    setImages(prev => [...prev, ...files.slice(0, 3 - prev.length)]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error(t('comments.notAuthenticated'));

    const imageUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('comment-images')
        .upload(fileName, image);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('comment-images')
        .getPublicUrl(data.path);

      imageUrls.push(publicUrl);
    }

    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || (!commentText.trim() && rating === 0)) {
      toast({
        title: t('comments.error'),
        description: t('comments.commentOrRating'),
        variant: "destructive"
      });
      return;
    }

    setUploading(images.length > 0);

    try {
      const imageUrls = await uploadImages();
      
      const success = await addComment(
        commentText.trim() || undefined,
        rating || undefined,
        imageUrls
      );

      if (success) {
        // Reset form
        setRating(0);
        setCommentText("");
        setImages([]);
      }
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: t('comments.error'),
        description: t('comments.cannotPublish'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getUserDisplayName = (comment: typeof comments[0]) => {
    if (comment.profiles?.display_name) {
      return comment.profiles.display_name;
    }
    if (comment.profiles?.username) {
      return comment.profiles.username;
    }
    return t('comments.consumer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img 
                src={restaurant.logo_url} 
                alt={restaurant.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="h-5 w-5 text-primary" />
              </div>
            )}
            {restaurant?.name}
          </DialogTitle>
          <DialogDescription>
            {t('comments.shareExperience')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistiques */}
          {totalComments > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <span className="font-medium">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({comments.filter(c => c.rating).length} {t('comments.ratings')})
                  </span>
                </div>
                <Badge variant="secondary">
                  {totalComments} {totalComments > 1 ? t('comments.comments') : t('comments.comment')}
                </Badge>
              </div>
            </div>
          )}

          {/* Formulaire de commentaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Note */}
            <div className="space-y-2">
              <Label>{t('comments.yourRating')}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-colors"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoverRating || rating)
                          ? 'fill-current text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <Label htmlFor="comment">{t('comments.yourComment')}</Label>
              <Textarea
                id="comment"
                placeholder={t('comments.shareExperiencePlaceholder')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>{t('comments.photos')}</Label>
              <div className="space-y-3">
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {images.length < 3 && (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Camera className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t('comments.clickToAddPhotos')}
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading || (!commentText.trim() && rating === 0)}
              className="w-full"
            >
              {uploading ? (
                t('comments.uploadImages')
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('comments.publishComment')}
                </>
              )}
            </Button>
          </form>

          {/* Liste des commentaires */}
          {loading ? (
            <div className="space-y-4">
              <h3 className="font-medium">{t('comments.clientComments')}</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : totalComments > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('comments.clientComments')}</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">
                          {getUserDisplayName(comment)}
                        </span>
                      </div>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(comment.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current text-yellow-500" />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {comment.comment_text && (
                      <p className="text-sm text-muted-foreground">
                        {comment.comment_text}
                      </p>
                    )}

                    {comment.images && comment.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {comment.images.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`${t('comments.commentImage')} ${index + 1}`}
                            className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(imageUrl, '_blank')}
                          />
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};