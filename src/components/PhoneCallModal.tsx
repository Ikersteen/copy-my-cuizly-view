import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhoneCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  restaurantName: string;
}

export const PhoneCallModal = ({ open, onOpenChange, phoneNumber, restaurantName }: PhoneCallModalProps) => {
  const { t } = useTranslation();

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Phone className="h-8 w-8" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {t('phone.callRestaurant')}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t('phone.confirmCall', { restaurant: restaurantName })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <div className="text-center py-2">
            <p className="text-2xl font-semibold text-primary">{phoneNumber}</p>
          </div>
          <Button
            onClick={handleCall}
            className="w-full gap-2"
            size="lg"
          >
            <Phone className="h-5 w-5" />
            {t('phone.callNow')}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
