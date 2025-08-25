import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Clock, CheckCircle, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount_amount: number;
  discount_percentage: number;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  category: string;
  restaurant?: {
    name: string;
  };
}

interface OffersSectionProps {
  userType: 'consumer' | 'restaurant';
  restaurantId?: string;
}

export const OffersSection = ({ userType, restaurantId }: OffersSectionProps) => {
  const [currentOffers, setCurrentOffers] = useState<Offer[]>([]);
  const [pastOffers, setPastOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOffers();
  }, [userType, restaurantId]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('offers').select(`
        *,
        restaurants!inner(name)
      `);

      if (userType === 'restaurant' && restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const current = data?.filter(offer => 
        new Date(offer.valid_until) > now && offer.is_active
      ) || [];
      
      const past = data?.filter(offer => 
        new Date(offer.valid_until) <= now || !offer.is_active
      ) || [];

      setCurrentOffers(current);
      setPastOffers(past);
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les offres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (userType !== 'restaurant') return;

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      await loadOffers();
      toast({
        title: "Offre supprimée",
        description: "L'offre a été supprimée avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'offre",
        variant: "destructive"
      });
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discount_percentage) {
      return `-${offer.discount_percentage}%`;
    }
    if (offer.discount_amount) {
      return `-${offer.discount_amount}$`;
    }
    return "Offre spéciale";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {userType === 'restaurant' ? 'Mes offres' : 'Vos offres'}
        </CardTitle>
        <CardDescription>
          {userType === 'restaurant' 
            ? 'Gérez vos offres actives et archivées' 
            : 'Suivez vos offres en cours et votre historique'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2" translate="no">
              <Clock className="h-4 w-4" />
              En cours ({currentOffers.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2" translate="no">
              <CheckCircle className="h-4 w-4" />
              Terminées ({pastOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentOffers.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Aucune offre en cours
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userType === 'restaurant' 
                    ? 'Créez votre première offre pour attirer des clients' 
                    : 'Les nouvelles offres apparaîtront ici'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{offer.title}</h4>
                        <Badge variant="default" className="text-xs">
                          {formatDiscount(offer)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {offer.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {offer.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valide jusqu'au {formatDate(offer.valid_until)}
                      </p>
                      {userType === 'consumer' && offer.restaurant && (
                        <p className="text-xs font-medium text-primary mt-1">
                          {offer.restaurant.name}
                        </p>
                      )}
                    </div>
                    {userType === 'restaurant' && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastOffers.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Aucune offre terminée
                </h3>
                <p className="text-sm text-muted-foreground">
                  L'historique de vos offres apparaîtra ici
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg opacity-75">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{offer.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatDiscount(offer)}
                        </Badge>
                        <Badge 
                          variant={!offer.is_active ? "destructive" : "secondary"} 
                          className="text-xs"
                        >
                          {!offer.is_active ? 'Désactivée' : 'Expirée'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {offer.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {!offer.is_active ? 'Désactivée le' : 'Expirée le'} {formatDate(offer.valid_until)}
                      </p>
                      {userType === 'consumer' && offer.restaurant && (
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                          {offer.restaurant.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};