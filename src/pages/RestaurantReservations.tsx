import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RestaurantReservationsSection } from "@/components/RestaurantReservationsSection";
import { useLocalizedRoute } from "@/lib/routeTranslations";

const RestaurantReservations = () => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const dashboardRoute = useLocalizedRoute('/dashboard');

  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();

        if (profile?.user_type !== 'restaurant_owner') {
          toast({
            title: t('common.error'),
            description: t('reservation.accessDenied'),
            variant: "destructive",
          });
          navigate(dashboardRoute);
          return;
        }

        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (restaurant) {
          setRestaurantId(restaurant.id);
        }
      } catch (error) {
        console.error('Error loading restaurant:', error);
        toast({
          title: t('common.error'),
          description: t('common.errorLoadingData'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantData();
  }, [navigate, t, toast, dashboardRoute]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cuizly-primary"></div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-center text-muted-foreground">
            {t('reservation.noRestaurant')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(dashboardRoute)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('navigation.backToDashboard')}
          </Button>
          
          <h1 className="text-3xl font-bold text-cuizly-primary mb-2">
            {t('reservation.reservations')}
          </h1>
          <p className="text-muted-foreground">
            {t('reservation.manageReservations')}
          </p>
        </div>

        <RestaurantReservationsSection restaurantId={restaurantId} />
      </div>
    </div>
  );
};

export default RestaurantReservations;
