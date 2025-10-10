import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import GoogleMap from "@/components/GoogleMap";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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
              <p className="text-destructive">{t('map.loadError')}</p>
            </div>
          )}
          {apiKey && !loading && !error && (
            <GoogleMap 
              apiKey={apiKey}
              center={{ lat: 45.5017, lng: -73.5673 }}
              zoom={15}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
