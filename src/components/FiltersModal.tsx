import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  cuisines: string[];
  priceRange: string[];
  rating: number;
  deliveryTime: number;
  distance: number;
}

const CUISINE_OPTIONS = [
  "Française", "Italienne", "Japonaise", "Chinoise", "Mexicaine", "Indienne",
  "Thaï", "Libanaise", "Grecque", "Américaine", "Québécoise", "Coréenne",
  "Vietnamienne", "Espagnole", "Marocaine", "Turque"
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export const FiltersModal = ({ open, onOpenChange, onApplyFilters }: FiltersModalProps) => {
  const [filters, setFilters] = useState<FilterOptions>({
    cuisines: [],
    priceRange: [],
    rating: 0,
    deliveryTime: 60,
    distance: 15
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      cuisines: [],
      priceRange: [],
      rating: 0,
      deliveryTime: 60,
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
          <DialogTitle>Filtrer les restaurants</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Types de cuisine */}
          <div>
            <Label className="text-base font-medium mb-3 block">Types de cuisine</Label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <Badge
                  key={cuisine}
                  variant={filters.cuisines.includes(cuisine) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                  {filters.cuisines.includes(cuisine) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Gamme de prix */}
          <div>
            <Label className="text-base font-medium mb-3 block">Gamme de prix</Label>
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
              Note minimale: {filters.rating}/5
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

          {/* Temps de livraison */}
          <div>
            <Label className="text-base font-medium">
              Temps de livraison max: {filters.deliveryTime} min
            </Label>
            <Slider
              value={[filters.deliveryTime]}
              onValueChange={([value]) => setFilters(prev => ({ ...prev, deliveryTime: value }))}
              max={120}
              min={15}
              step={15}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15 min</span>
              <span>120 min</span>
            </div>
          </div>

          <Separator />

          {/* Distance */}
          <div>
            <Label className="text-base font-medium">
              Distance maximale: {filters.distance} km
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
            Réinitialiser
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Appliquer les filtres
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};