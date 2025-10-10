import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface EmbeddedMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
}

export const EmbeddedMapModal = ({ open, onOpenChange, address }: EmbeddedMapModalProps) => {
  const { t } = useTranslation();
  
  // Encoder l'adresse pour l'URL Google Maps
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t('map.directions')}</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[600px] rounded-b-lg overflow-hidden">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t('map.mapView')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
