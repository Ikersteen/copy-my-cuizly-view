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

  const handleOpenInMaps = async () => {
    try {
      // Géocoder l'adresse pour obtenir les coordonnées
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      const coordinates = data.features?.[0]?.center;
      
      if (coordinates) {
        // Ouvrir la carte Mapbox dans un nouvel onglet avec les coordonnées
        const [lng, lat] = coordinates;
        const url = `https://www.mapbox.com/search/${encodeURIComponent(address)}/place/${lat},${lng}`;
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la carte:', error);
    }
  };

  useEffect(() => {
    if (!open || !mapContainer.current || map.current) return;

    // Géocoder l'adresse avec Mapbox Geocoding API
    const geocodeAddress = async () => {
      try {
        console.log('Géocodage de l\'adresse:', address);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
        );
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
          console.error('Aucune coordonnée trouvée pour cette adresse');
          return;
        }
        
        const center: [number, number] = data.features[0].center;
        console.log('Coordonnées trouvées:', center);

        if (!mapContainer.current) return;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center,
          zoom: 15
        });

        // Ajouter un marqueur
        new mapboxgl.Marker()
          .setLngLat(center)
          .setPopup(new mapboxgl.Popup().setHTML(`<div class="p-2"><strong>${address}</strong></div>`))
          .addTo(map.current);

        // Ajouter les contrôles
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      } catch (error) {
        console.error('Erreur de géocodage:', error);
      }
    };

    geocodeAddress();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
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
