import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { updateUserType } = useUserProfile();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchProfile = async () => {
    setIsLoading(true);
    const newUserType = currentProfile === 'consumer' ? 'restaurant_owner' : 'consumer';
    
    const { error } = await updateUserType(newUserType);
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer le type de profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profil mis à jour",
        description: newUserType === 'restaurant_owner' 
          ? "Vous êtes maintenant en mode Cuizly Pro"
          : "Vous êtes maintenant en mode Consommateur",
      });
      onOpenChange(false);
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profileSwitch.title')}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            {currentProfile === 'consumer' ? (
              <>
                <div>Vous êtes actuellement connecté en tant que Consommateur.</div>
                <div>Souhaitez-vous passer en mode Cuizly Pro&nbsp;?</div>
              </>
            ) : (
              t('profileSwitch.restaurantMessage')
            )}
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
            disabled={isLoading}
          >
            {isLoading ? "Changement en cours..." : (
              currentProfile === 'consumer' 
                ? t('profileSwitch.switchToRestaurant')
                : t('profileSwitch.switchToConsumer')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};