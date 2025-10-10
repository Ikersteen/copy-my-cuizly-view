import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Instagram, Facebook } from "lucide-react";

interface SocialMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  type: 'instagram' | 'facebook';
}

export const SocialMediaModal = ({ open, onOpenChange, url, type }: SocialMediaModalProps) => {
  const { t } = useTranslation();
  
  const getTitle = () => {
    return type === 'instagram' 
      ? t('social.viewInstagram') 
      : t('social.viewFacebook');
  };

  const getIcon = () => {
    return type === 'instagram' 
      ? <Instagram className="h-5 w-5" />
      : <Facebook className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center gap-2">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="w-full h-[600px] rounded-b-lg overflow-hidden">
          <iframe
            src={url}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={getTitle()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
