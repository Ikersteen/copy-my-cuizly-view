import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseAddress, formatAddress } from "@/lib/addressUtils";
import { useTranslation } from 'react-i18next';

interface AddressSelectorProps {
  value?: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  required?: boolean;
}

// Liste de rues populaires de Montréal pour l'autocomplete
const MONTREAL_STREETS = [
  "Rue Sainte-Catherine",
  "Boulevard Saint-Laurent",
  "Rue Notre-Dame",
  "Avenue du Parc",
  "Rue Sherbrooke",
  "Boulevard René-Lévesque",
  "Rue Saint-Denis",
  "Avenue Mont-Royal",
  "Rue Peel",
  "Rue Guy",
  "Avenue McGill College",
  "Rue Crescent",
  "Boulevard de Maisonneuve",
  "Rue Saint-Jacques",
  "Avenue des Pins",
  "Rue Rachel",
  "Rue Laurier",
  "Rue Bernard",
  "Avenue du Mont-Royal",
  "Rue Ontario",
  "Rue Beaubien",
  "Rue Masson",
  "Boulevard Pie-IX",
  "Avenue Papineau",
  "Rue Fleury",
  "Boulevard Henri-Bourassa",
  "Rue Jean-Talon",
  "Avenue de l'Esplanade",
  "Rue Clark",
  "Rue Hutchison",
  "Avenue Fairmount",
  "Rue Saint-Viateur",
  "Rue Van Horne",
  "Avenue Laurier Ouest",
  "Rue Duluth",
  "Boulevard Saint-Joseph",
  "Rue Prince-Arthur",
  "Avenue de Gaspe",
  "Rue Plateau Mont-Royal",
  "Avenue Christophe-Colomb"
];

const MONTREAL_NEIGHBORHOODS = [
  "Plateau-Mont-Royal",
  "Ville-Marie",
  "Le Sud-Ouest",
  "Verdun",
  "Rosemont–La Petite-Patrie",
  "Villeray–Saint-Michel–Parc-Extension",
  "Ahuntsic-Cartierville",
  "Côte-des-Neiges–Notre-Dame-de-Grâce",
  "Outremont",
  "LaSalle",
  "Lachine",
  "Saint-Laurent",
  "Mercier–Hochelaga-Maisonneuve",
  "Anjou",
  "Montréal-Nord",
  "Saint-Léonard",
  "Rivière-des-Prairies–Pointe-aux-Trembles"
];

export const AddressSelector = ({
  value = "",
  onChange,
  placeholder = "Commencez à taper une adresse à Montréal...",
  label = "Adresse",
  className,
  required = false
}: AddressSelectorProps) => {
  const { t } = useTranslation();
  
  // Use translation or fallback to defaults
  const translatedPlaceholder = placeholder === "Commencez à taper une adresse à Montréal..." ? t('addresses.placeholder') : placeholder;
  const translatedLabel = label === "Adresse" ? t('addresses.label') : label;
  
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filterSuggestions = (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Filtrer les rues
    const streetMatches = MONTREAL_STREETS.filter(street =>
      street.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    );

    // Filtrer les quartiers
    const neighborhoodMatches = MONTREAL_NEIGHBORHOODS.filter(neighborhood =>
      neighborhood.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
    );

    // Générer des adresses complètes pour les rues
    const streetAddresses = streetMatches.slice(0, 5).map(street => {
      const numbers = ['123', '456', '789', '101', '234'];
      return `${numbers[Math.floor(Math.random() * numbers.length)]} ${street}, Montréal, QC`;
    });

    // Ajouter les quartiers comme suggestions
    const neighborhoodAddresses = neighborhoodMatches.slice(0, 3).map(neighborhood => 
      `${neighborhood}, Montréal, QC`
    );

    const allSuggestions = [...streetAddresses, ...neighborhoodAddresses].slice(0, 8);
    setSuggestions(allSuggestions);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    if (newValue.trim()) {
      filterSuggestions(newValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          onChange(inputValue);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Petite pause pour permettre le clic sur les suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onChange(inputValue);
    }, 200);
  };

  return (
    <div className={cn("relative space-y-2", className)}>
      <Label>{translatedLabel}{required && " *"}</Label>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={translatedPlaceholder}
          className="pr-10"
          required={required}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`w-full justify-start text-left p-3 h-auto whitespace-normal ${
                    index === selectedIndex ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start space-x-2 w-full">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium">{suggestion.split(',')[0]}</div>
                      <div className="text-muted-foreground text-xs">
                        {suggestion.split(',').slice(1).join(',').trim()}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inputValue && !showSuggestions && (
        <p className="text-xs text-muted-foreground">
          {t('addresses.tip')}
        </p>
      )}
    </div>
  );
};

// Legacy export for backward compatibility
export const MontrealAddressSelector = AddressSelector;