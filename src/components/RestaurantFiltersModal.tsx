import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { X, TrendingUp, DollarSign, Users, Clock } from "lucide-react";

interface RestaurantFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: RestaurantFilterOptions) => void;
}

export interface RestaurantFilterOptions {
  categories: string[];
  priceRange: string[];
  dateRange: string;
  activeOnly: boolean;
  sortBy: string;
}

const CATEGORY_OPTIONS = [
  "Promotion", "Nouveau", "Populaire", "Spécialité", "Menu du jour", 
  "Végétarien", "Végétalien", "Sans gluten", "Halal", "Casher"
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

const DATE_RANGES = [
  { label: "Aujourd'hui", value: "today" },
  { label: "Cette semaine", value: "week" },
  { label: "Ce mois", value: "month" },
  { label: "Tout", value: "all" }
];

const SORT_OPTIONS = [
  { label: "Plus récent", value: "newest", icon: Clock },
  { label: "Plus populaire", value: "popular", icon: TrendingUp },
  { label: "Prix croissant", value: "price_asc", icon: DollarSign },
  { label: "Prix décroissant", value: "price_desc", icon: DollarSign },
  { label: "Nombre de vues", value: "views", icon: Users }
];

export const RestaurantFiltersModal = ({ open, onOpenChange, onApplyFilters }: RestaurantFiltersModalProps) => {
  const [filters, setFilters] = useState<RestaurantFilterOptions>({
    categories: [],
    priceRange: [],
    dateRange: "all",
    activeOnly: true,
    sortBy: "newest"
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      categories: [],
      priceRange: [],
      dateRange: "all",
      activeOnly: true,
      sortBy: "newest"
    });
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
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
          <DialogTitle>Filtrer vos offres et menus</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Catégories */}
          <div>
            <Label className="text-base font-medium mb-3 block">Catégories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(category => (
                <Badge
                  key={category}
                  variant={filters.categories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                  {filters.categories.includes(category) && (
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

          {/* Période */}
          <div>
            <Label className="text-base font-medium mb-3 block">Période</Label>
            <div className="grid grid-cols-2 gap-2">
              {DATE_RANGES.map(date => (
                <Button
                  key={date.value}
                  variant={filters.dateRange === date.value ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: date.value }))}
                >
                  {date.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Afficher uniquement les éléments actifs</Label>
                <p className="text-xs text-muted-foreground">
                  Masquer les offres et menus désactivés
                </p>
              </div>
              <Switch
                checked={filters.activeOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, activeOnly: checked }))}
              />
            </div>
          </div>

          <Separator />

          {/* Tri */}
          <div>
            <Label className="text-base font-medium mb-3 block">Trier par</Label>
            <div className="grid grid-cols-1 gap-2">
              {SORT_OPTIONS.map(sort => {
                const IconComponent = sort.icon;
                return (
                  <Button
                    key={sort.value}
                    variant={filters.sortBy === sort.value ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: sort.value }))}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {sort.label}
                  </Button>
                );
              })}
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