import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Instagram, Facebook, Music2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  type: 'instagram' | 'facebook' | 'tiktok';
}

export const SocialMediaModal = ({ open, onOpenChange, url, type }: SocialMediaModalProps) => {
  const { t } = useTranslation();
  
  const getTitle = () => {
    if (type === 'instagram') return t('social.viewInstagram');
    if (type === 'facebook') return t('social.viewFacebook');
    return t('social.viewTikTok');
  };

  const getIcon = () => {
    if (type === 'instagram') return <Instagram className="h-8 w-8" />;
    if (type === 'facebook') return <Facebook className="h-8 w-8" />;
    return <Music2 className="h-8 w-8" />;
  };

  const getPlatformName = () => {
    if (type === 'instagram') return 'Instagram';
    if (type === 'facebook') return 'Facebook';
    return 'TikTok';
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              {getIcon()}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t('social.redirectMessage', { platform: getPlatformName() })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleOpenExternal}
            className="w-full gap-2"
            size="lg"
          >
            <ExternalLink className="h-5 w-5" />
            {t('social.openButton', { platform: getPlatformName() })}
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
