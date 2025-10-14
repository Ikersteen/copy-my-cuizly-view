import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { ImprovedRestaurantProfileModal } from "@/components/ImprovedRestaurantProfileModal";
import { useState } from "react";

export default function RestaurantProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dashboardRoute = useLocalizedRoute('/dashboard');
  const [modalOpen, setModalOpen] = useState(true);

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

        <ImprovedRestaurantProfileModal
          isOpen={modalOpen}
          onClose={handleClose}
          onUpdate={() => {
            // Optionally refresh data
          }}
        />
      </div>
    </div>
  );
}
