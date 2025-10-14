import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFiltersDrawer } from "./MobileFiltersDrawer";
import { useTranslation } from 'react-i18next';

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  cuisines: string[];
  priceRange: string[];
  rating: number;
  distance: number;
}

export const FiltersModal = ({ open, onOpenChange, onApplyFilters }: FiltersModalProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterOptions>({
    cuisines: [],
    priceRange: [],
    rating: 0,
    distance: 15
  });

  const CUISINE_OPTIONS = [
    { key: "french", value: "Française" },
    { key: "italian", value: "Italienne" },
    { key: "japanese", value: "Japonaise" },
    { key: "chinese", value: "Chinoise" },
    { key: "mexican", value: "Mexicaine" },
    { key: "indian", value: "Indienne" },
    { key: "thai", value: "Thaïlandaise" },
    { key: "lebanese", value: "Libanaise" },
    { key: "greek", value: "Grecque" },
    { key: "american", value: "Américaine" },
    { key: "quebecois", value: "Québécoise" },
    { key: "korean", value: "Coréenne" },
    { key: "vietnamese", value: "Vietnamienne" },
    { key: "spanish", value: "Espagnole" },
    { key: "moroccan", value: "Marocaine" },
    { key: "turkish", value: "Turque" },
    { key: "african", value: "Africaine" }
  ];

  const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

  // Use mobile drawer on mobile devices
  if (isMobile) {
    return (
      <MobileFiltersDrawer 
        open={open} 
        onOpenChange={onOpenChange} 
        onApplyFilters={onApplyFilters} 
      />
    );
  }

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      cuisines: [],
      priceRange: [],
      rating: 0,
      distance: 15
    });
  };

  const toggleCuisine = (cuisine: string) => {
    setFilters(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }));
  };

  const togglePriceRange = (price: string) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(price)
        ? prev.priceRange.filter(p => p !== price)
        : [...prev.priceRange, price]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('filters.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Types de cuisine */}
          <div>
            <Label className="text-base font-medium mb-3 block">Cuisines</Label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <Badge
                  key={cuisine.key}
                  variant={filters.cuisines.includes(cuisine.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleCuisine(cuisine.value)}
                >
                  {cuisine.value}
                  {filters.cuisines.includes(cuisine.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Gamme de prix */}
          <div>
            <Label className="text-base font-medium mb-3 block">{t('filters.priceRange')}</Label>
            <div className="flex gap-2">
              {PRICE_RANGES.map(price => (
                <Badge
                  key={price}
                  variant={filters.priceRange.includes(price) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105 text-lg px-4 py-2"
                  onClick={() => togglePriceRange(price)}
                >
                  {price}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Note minimale */}
          <div>
            <Label className="text-base font-medium">
              {t('filters.rating')}: {filters.rating}/5
            </Label>
            <Slider
              value={[filters.rating]}
              onValueChange={([value]) => setFilters(prev => ({ ...prev, rating: value }))}
              max={5}
              min={0}
              step={0.5}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 ⭐</span>
              <span>5 ⭐</span>
            </div>
          </div>

          <Separator />

          {/* Distance */}
          <div>
            <Label className="text-base font-medium">
              {t('filters.distance')}: {filters.distance} km
            </Label>
            <Slider
              value={[filters.distance]}
              onValueChange={([value]) => setFilters(prev => ({ ...prev, distance: value }))}
              max={25}
              min={1}
              step={1}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 km</span>
              <span>25 km</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            {t('filters.reset')}
          </Button>
          <Button onClick={handleApply} className="flex-1">
            {t('filters.apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};