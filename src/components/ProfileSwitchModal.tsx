import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { useNavigate } from "react-router-dom";

interface ProfileSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: 'consumer' | 'restaurant_owner';
}

export const ProfileSwitchModal = ({
  open,
  onOpenChange,
  currentProfile
}: ProfileSwitchModalProps) => {
  const { t } = useTranslation();
  const { logout } = useSecureAuth();
  const navigate = useNavigate();

  const handleSwitchProfile = async () => {
    await logout();
    onOpenChange(false);
    navigate('/auth');
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
          <Button
            onClick={handleSwitchProfile}
            className="w-full sm:w-auto"
          >
            {currentProfile === 'consumer' 
              ? t('profileSwitch.switchToRestaurant')
              : t('profileSwitch.switchToConsumer')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};