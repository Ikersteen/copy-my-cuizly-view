import { useState } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter, 
  DrawerClose 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileFiltersDrawerProps {
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

const CUISINE_OPTIONS = [
  "Française", "Italienne", "Japonaise", "Chinoise", "Mexicaine", "Indienne",
  "Thaïlandaise", "Libanaise", "Grecque", "Américaine", "Québécoise", "Coréenne",
  "Vietnamienne", "Espagnole", "Marocaine", "Turque"
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export const MobileFiltersDrawer = ({ open, onOpenChange, onApplyFilters }: MobileFiltersDrawerProps) => {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterOptions>({
    cuisines: [],
    priceRange: [],
    rating: 0,
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

  if (!isMobile) {
    return null; // Use regular modal on desktop
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </DrawerClose>

        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-xl font-semibold">Filtres</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto flex-1">
          {/* Cuisines */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Types de cuisine</Label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant={filters.cuisines.includes(cuisine) ? "default" : "outline"}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-sm"
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Gamme de prix</Label>
            <div className="flex gap-2">
              {PRICE_RANGES.map((price) => (
                <Badge
                  key={price}
                  variant={filters.priceRange.includes(price) ? "default" : "outline"}
                  className="cursor-pointer min-h-[44px] min-w-[44px] justify-center text-base"
                  onClick={() => togglePriceRange(price)}
                >
                  {price}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Rating */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Note minimum</Label>
            <div className="px-2">
              <Slider
                value={[filters.rating]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value[0] }))}
                max={5}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm">{filters.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">5 étoiles</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Distance */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Distance maximum</Label>
            <div className="px-2">
              <Slider
                value={[filters.distance]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, distance: value[0] }))}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm">{filters.distance} km</span>
                <span className="text-sm text-muted-foreground">50 km</span>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-4 space-y-2">
          <Button onClick={handleApply} className="w-full min-h-[52px] text-base">
            Appliquer les filtres
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full min-h-[52px] text-base">
            Réinitialiser
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};