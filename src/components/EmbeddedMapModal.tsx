import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '@/lib/mapboxConfig';

// Configuration du token Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

interface EmbeddedMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
}

export const EmbeddedMapModal = ({ open, onOpenChange, address }: EmbeddedMapModalProps) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const handleOpenInMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `https://maps.apple.com/?address=${encodedAddress}`
      : `https://maps.google.com/?q=${encodedAddress}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!open || !mapContainer.current) return;

    // Géocoder l'adresse (vous pourriez utiliser un service de géocodage)
    // Pour l'instant, on centre sur Montréal par défaut
    const defaultCenter: [number, number] = [-73.5673, 45.5017];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 15
    });

    // Ajouter un marqueur
    new mapboxgl.Marker()
      .setLngLat(defaultCenter)
      .setPopup(new mapboxgl.Popup().setHTML(`<div class="p-2"><strong>${address}</strong></div>`))
      .addTo(map.current);

    // Ajouter les contrôles
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [open, address]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle>{address}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInMaps}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t('map.openExternal')}
          </Button>
        </DialogHeader>
        <div className="w-full h-[600px] rounded-b-lg overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
