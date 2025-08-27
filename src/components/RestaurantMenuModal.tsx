import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Clock, MapPin, Heart, Phone, Mail, ChefHat, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { RatingComponent } from "@/components/RatingComponent";
import { CommentModal } from "@/components/CommentModal";

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type: string;
  is_active: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string[];
  price_range: string;
  address: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  cover_image_url?: string;
  rating?: number;
  delivery_time?: string;
}

interface RestaurantMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

export const RestaurantMenuModal = ({ 
  open, 
  onOpenChange, 
  restaurant 
}: RestaurantMenuModalProps) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  useEffect(() => {
    if (open && restaurant?.id) {
      loadMenus();
    }
  }, [open, restaurant?.id]);

  const loadMenus = async () => {
    if (!restaurant?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!restaurant?.id) return;
    
    try {
      await toggleFavorite(restaurant.id);
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    }
  };

  if (!restaurant) return null;

  const isRestaurantFavorite = isFavorite(restaurant.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:w-8 [&>button]:h-8">
        <DialogHeader className="space-y-4">
          {/* Restaurant Cover */}
           <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
            {restaurant.cover_image_url && (
              <img 
                src={restaurant.cover_image_url} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            {restaurant.cover_image_url && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            )}
            
             {/* Restaurant Logo Only */}
             <div className="absolute bottom-4 left-4">
               {restaurant.logo_url ? (
                 <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                   <img 
                     src={restaurant.logo_url} 
                     alt={restaurant.name}
                     className="w-full h-full object-cover"
                   />
                 </div>
               ) : (
                 <div className="w-20 h-20 rounded-xl bg-white/90 flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
                   <ChefHat className="h-8 w-8 text-primary" />
                 </div>
               )}
             </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Restaurant Info */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {restaurant.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
              )}
              {restaurant.delivery_time && (
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.delivery_time}</span>
                </div>
              )}
              {restaurant.price_range && (
                <div className="space-y-1">
                  <span className="text-lg font-bold text-foreground block">{restaurant.name}</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Montreal</span>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="secondary">
                      {restaurant.price_range}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {restaurant.description && (
              <p className="text-muted-foreground">
                {restaurant.description}
              </p>
            )}

            {/* Cuisine Types */}
            <div className="flex flex-wrap gap-2">
              {restaurant.cuisine_type?.map((cuisine, idx) => (
                <Badge key={idx} variant="outline">
                  {cuisine}
                </Badge>
              ))}
            </div>

            {/* Contact Info */}
            {(restaurant.phone || restaurant.email) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {restaurant.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.email}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Ratings Section */}
          <div className="space-y-4">
            <RatingComponent restaurantId={restaurant.id} showAddRating={true} />
          </div>

          <Separator />

           {/* Menus Section */}
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-xl font-semibold">Nos menus</h3>
               {menus.length > 0 && (
                 <Badge variant="outline">{menus.length} menu{menus.length > 1 ? 's' : ''}</Badge>
               )}
             </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3"></div>
                      <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full mb-1"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : menus.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h4 className="text-lg font-medium text-muted-foreground mb-2">
                    Aucun menu disponible
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ce restaurant n'a pas encore ajouté de menus
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menus.map((menu) => (
                  <Card key={menu.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {menu.image_url && (
                        <div className="aspect-video mb-3 rounded-lg overflow-hidden">
                          <img
                            src={menu.image_url}
                            alt="Menu"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          {menu.cuisine_type}
                        </Badge>
                        <p className="text-sm text-foreground line-clamp-3">
                          {menu.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1"
              onClick={() => setShowCommentModal(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Commentaire
            </Button>
            <Button variant="outline" onClick={handleToggleFavorite}>
              <Heart 
                className={`h-4 w-4 mr-2 ${isRestaurantFavorite ? 'fill-current text-red-500' : ''}`} 
              />
              {isRestaurantFavorite ? 'Retiré des favoris' : 'Ajouter aux favoris'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Comment Modal */}
      <CommentModal 
        open={showCommentModal}
        onOpenChange={setShowCommentModal}
        restaurant={restaurant}
      />
    </Dialog>
  );
};