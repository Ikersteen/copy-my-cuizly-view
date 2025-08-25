import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Camera, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
}

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  rating: number;
  images: string[];
  created_at: string;
}

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

export const CommentModal = ({ open, onOpenChange, restaurant }: CommentModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && restaurant) {
      fetchComments();
    }
  }, [open, restaurant]);

  const fetchComments = async () => {
    if (!restaurant) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 3 images maximum",
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
    if (!session) throw new Error('Non authentifié');

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
        title: "Erreur",
        description: "Veuillez ajouter un commentaire ou une note",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setUploading(images.length > 0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const imageUrls = await uploadImages();

      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: session.user.id,
          restaurant_id: restaurant.id,
          comment_text: commentText.trim() || null,
          rating: rating || null,
          images: imageUrls
        });

      if (error) throw error;

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès"
      });

      // Reset form
      setRating(0);
      setCommentText("");
      setImages([]);
      fetchComments();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de publier le commentaire",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const averageRating = comments.length > 0 
    ? comments.filter(c => c.rating).reduce((sum, c) => sum + c.rating, 0) / comments.filter(c => c.rating).length
    : 0;

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
            Partagez votre expérience avec d'autres gourmets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistiques */}
          {comments.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <span className="font-medium">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({comments.filter(c => c.rating).length} évaluations)
                  </span>
                </div>
                <Badge variant="secondary">
                  {comments.length} commentaire{comments.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          )}

          {/* Formulaire de commentaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Note */}
            <div className="space-y-2">
              <Label>Votre note (optionnel)</Label>
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
              <Label htmlFor="comment">Votre commentaire</Label>
              <Textarea
                id="comment"
                placeholder="Partagez votre expérience..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Photos (max 3)</Label>
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
                        Cliquez pour ajouter des photos
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || (!commentText.trim() && rating === 0)}
              className="w-full"
            >
              {uploading ? (
                "Upload des images..."
              ) : loading ? (
                "Publication..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publier le commentaire
                </>
              )}
            </Button>
          </form>

          {/* Liste des commentaires */}
          {comments.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Commentaires des clients</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        Utilisateur anonyme
                      </span>
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
                            alt={`Comment image ${index + 1}`}
                            className="w-full h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')}
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