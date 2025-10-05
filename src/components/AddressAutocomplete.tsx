import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@googlemaps/js-api-loader';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  label = "Adresse",
  placeholder = "Entrez l'adresse complète",
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { apiKey, loading: keyLoading } = useGoogleMapsKey();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey || !inputRef.current || isLoaded) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      if (!inputRef.current) return;

      // Initialize autocomplete with restrictions to Canada
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ca' },
        fields: ['formatted_address', 'address_components', 'geometry']
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address);
        }
      });

      setIsLoaded(true);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey, onChange, isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="address">{label}</Label>}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="address"
          value={value}
          onChange={handleInputChange}
          placeholder={keyLoading ? "Chargement..." : placeholder}
          disabled={keyLoading}
          required={required}
          className="pl-10"
        />
      </div>
    </div>
  );
};
