import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EmbeddedMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
}

export const EmbeddedMapModal = ({ open, onOpenChange, address }: EmbeddedMapModalProps) => {
  const { t } = useTranslation();
  const { apiKey, loading, error } = useGoogleMapsKey();

  const handleOpenInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `https://maps.apple.com/?address=${encodedAddress}`
      : `https://maps.google.com/?q=${encodedAddress}`;
    window.open(url, '_blank');
  };

  const encodedAddress = encodeURIComponent(address);
  const mapEmbedUrl = apiKey ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle>{address}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInGoogleMaps}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t('map.openExternal')}
          </Button>
        </DialogHeader>
        <div className="w-full h-[600px] rounded-b-lg overflow-hidden">
          {loading && (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <LoadingSpinner size="md" />
            </div>
          )}
          {error && (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center p-6">
                <p className="text-destructive mb-2">{t('map.loadError')}</p>
                <p className="text-muted-foreground text-sm">{t('map.apiKeyError')}</p>
              </div>
            </div>
          )}
          {apiKey && !loading && !error && (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapEmbedUrl}
              title={`Carte de ${address}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
