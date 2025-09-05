import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";

interface ProfileSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: 'consumer' | 'restaurant_owner';
  onSwitchToRestaurant: () => void;
  onSwitchToConsumer: () => void;
}

export const ProfileSwitchModal = ({
  open,
  onOpenChange,
  currentProfile,
  onSwitchToRestaurant,
  onSwitchToConsumer
}: ProfileSwitchModalProps) => {
  const { t } = useTranslation();

  const handleSwitchToRestaurant = () => {
    onSwitchToRestaurant();
    onOpenChange(false);
  };

  const handleSwitchToConsumer = () => {
    onSwitchToConsumer();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profileSwitch.title')}
          </DialogTitle>
          <DialogDescription>
            {currentProfile === 'consumer' 
              ? t('profileSwitch.consumerMessage')
              : t('profileSwitch.restaurantMessage')
            }
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          {currentProfile === 'consumer' ? (
            <Button
              onClick={handleSwitchToRestaurant}
              className="w-full sm:w-auto"
            >
              {t('profileSwitch.switchToRestaurant')}
            </Button>
          ) : (
            <Button
              onClick={handleSwitchToConsumer}
              className="w-full sm:w-auto"
            >
              {t('profileSwitch.switchToConsumer')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};