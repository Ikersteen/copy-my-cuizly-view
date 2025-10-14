import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhoneCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  restaurantName?: string;
}

export const PhoneCallModal = ({ open, onOpenChange, phoneNumber, restaurantName }: PhoneCallModalProps) => {
  const { t } = useTranslation();

  console.log('PhoneCallModal rendered:', { open, phoneNumber, restaurantName });

  const handleCall = () => {
    console.log('Calling:', phoneNumber);
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
            {t('phone.callTitle')}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {restaurantName 
              ? t('phone.callMessageWithName', { name: restaurantName, phone: phoneNumber })
              : t('phone.callMessage', { phone: phoneNumber })
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleCall}
            className="w-full gap-2"
            size="lg"
          >
            <Phone className="h-5 w-5" />
            {t('phone.callButton')}
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
