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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      <DrawerContent className="max-h-[90vh] mobile-friendly-spacing">
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none touch-target">
          <X className="h-5 w-5" />
          <span className="sr-only">{t('filters.close')}</span>
        </DrawerClose>

        <DrawerHeader className="pb-4 px-6">
          <DrawerTitle className="text-xl sm:text-2xl font-semibold">{t('filters.filters')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-4 space-y-6 overflow-y-auto flex-1">
          {/* Cuisines */}
          <div className="space-y-4">
            <Label className="text-base font-medium block">{t('filters.preferredCuisines')}</Label>
            <div className="flex flex-wrap gap-3">
              {CUISINE_OPTIONS.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant={filters.cuisines.includes(cuisine) ? "default" : "outline"}
                  className="cursor-pointer touch-target px-4 py-3 text-sm font-medium transition-all duration-200 focus-touch"
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-base font-medium block">{t('filters.priceRange')}</Label>
            <div className="flex gap-3">
              {PRICE_RANGES.map((price) => (
                <Badge
                  key={price}
                  variant={filters.priceRange.includes(price) ? "default" : "outline"}
                  className="cursor-pointer touch-target min-w-[56px] justify-center text-lg font-medium py-3 transition-all duration-200 focus-touch"
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
            <Label className="text-base font-medium block">{t('filters.minimumRating')}</Label>
            <div className="px-2">
              <Slider
                value={[filters.rating]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value[0] }))}
                max={5}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-base font-medium">{filters.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">5 {t('filters.stars')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Distance */}
          <div className="space-y-4">
            <Label className="text-base font-medium block">{t('filters.maximumDistance')}</Label>
            <div className="px-2">
              <Slider
                value={[filters.distance]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, distance: value[0] }))}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-3">
                <span className="text-base font-medium">{filters.distance} km</span>
                <span className="text-sm text-muted-foreground">50 km</span>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-4 px-6 space-y-3">
          <Button onClick={handleApply} className="mobile-button touch-device focus-touch">
            {t('filters.applyFilters')}
          </Button>
          <Button variant="outline" onClick={handleReset} className="mobile-button touch-device focus-touch">
            {t('filters.reset')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};