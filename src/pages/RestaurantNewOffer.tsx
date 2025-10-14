import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { NewOfferModal } from "@/components/NewOfferModal";
import { supabase } from "@/integrations/supabase/client";

export default function RestaurantNewOffer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dashboardRoute = useLocalizedRoute('/dashboard');
  const [modalOpen, setModalOpen] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (data) {
      setRestaurantId(data.id);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    navigate(dashboardRoute);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(dashboardRoute)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('navigation.back')}
        </Button>

        <NewOfferModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          restaurantId={restaurantId}
          onSuccess={() => {
            handleClose();
          }}
        />
      </div>
    </div>
  );
}
