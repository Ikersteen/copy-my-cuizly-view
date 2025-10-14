import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, TrendingUp, DollarSign, Users, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { CUISINE_TRANSLATIONS, SERVICE_TYPES_TRANSLATIONS } from "@/constants/cuisineTypes";

interface RestaurantFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: RestaurantFilterOptions) => void;
}

export interface RestaurantFilterOptions {
  categories: string[];
  cuisines: string[];
  serviceTypes: string[];
  priceRange: string[];
  dateRange: string;
  activeOnly: boolean;
  sortBy: string;
}

  const CUISINE_OPTIONS = [
    "french", "italian", "japanese", "chinese", "mexican", "indian",
    "thai", "lebanese", "greek", "american", "quebecois", "korean",
    "vietnamese", "spanish", "moroccan", "turkish", "african"
  ];

  const SERVICE_TYPE_OPTIONS = [
    "breakfast_brunch", "quick_lunch", "dinner_supper", "cafe_snack", 
    "specialized_detox_health", "late_night"
  ];

  const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export const RestaurantFiltersModal = ({ open, onOpenChange, onApplyFilters }: RestaurantFiltersModalProps) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<RestaurantFilterOptions>({
    categories: [],
    cuisines: [],
    serviceTypes: [],
    priceRange: [],
    dateRange: "all",
    activeOnly: true,
    sortBy: "newest"
  });

  const CATEGORY_OPTIONS = [
    { key: "promotion", value: t('restaurantFilters.categoryOptions.promotion') },
    { key: "new", value: t('restaurantFilters.categoryOptions.new') },
    { key: "popular", value: t('restaurantFilters.categoryOptions.popular') },
    { key: "specialty", value: t('restaurantFilters.categoryOptions.specialty') },
    { key: "dailyMenu", value: t('restaurantFilters.categoryOptions.dailyMenu') },
    { key: "vegetarian", value: t('restaurantFilters.categoryOptions.vegetarian') },
    { key: "vegan", value: t('restaurantFilters.categoryOptions.vegan') },
    { key: "glutenFree", value: t('restaurantFilters.categoryOptions.glutenFree') },
    { key: "halal", value: t('restaurantFilters.categoryOptions.halal') },
    { key: "kosher", value: t('restaurantFilters.categoryOptions.kosher') }
  ];

  const DATE_RANGES = [
    { labelKey: "restaurantFilters.dateRanges.today", value: "today" },
    { labelKey: "restaurantFilters.dateRanges.week", value: "week" },
    { labelKey: "restaurantFilters.dateRanges.month", value: "month" },
    { labelKey: "restaurantFilters.dateRanges.all", value: "all" }
  ];

  const SORT_OPTIONS = [
    { labelKey: "restaurantFilters.sortOptions.newest", value: "newest", icon: Clock },
    { labelKey: "restaurantFilters.sortOptions.popular", value: "popular", icon: TrendingUp },
    { labelKey: "restaurantFilters.sortOptions.priceAsc", value: "price_asc", icon: DollarSign },
    { labelKey: "restaurantFilters.sortOptions.priceDesc", value: "price_desc", icon: DollarSign },
    { labelKey: "restaurantFilters.sortOptions.views", value: "views", icon: Users }
  ];

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      categories: [],
      cuisines: [],
      serviceTypes: [],
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

  const toggleCuisine = (cuisine: string) => {
    setFilters(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }));
  };

  const toggleServiceType = (serviceType: string) => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(s => s !== serviceType)
        : [...prev.serviceTypes, serviceType]
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
          <DialogTitle>{t('restaurantFilters.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Catégories */}
          <div>
            <Label className="text-base font-medium mb-3 block">{t('restaurantFilters.categories')}</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(category => (
                <Badge
                  key={category.key}
                  variant={filters.categories.includes(category.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleCategory(category.value)}
                >
                  {category.value}
                  {filters.categories.includes(category.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Types de cuisine */}
          <div>
            <Label className="text-base font-medium mb-3 block">{t('restaurantFilters.cuisineTypes')}</Label>
            <Select onValueChange={toggleCuisine}>
              <SelectTrigger>
                <SelectValue placeholder={t('restaurantFilters.selectCuisine') || "Sélectionner une cuisine"} />
              </SelectTrigger>
              <SelectContent>
                {CUISINE_OPTIONS.map(cuisine => (
                  <SelectItem key={cuisine} value={cuisine}>
                    {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.cuisines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.cuisines.map(cuisine => (
                  <Badge key={cuisine} variant="default" className="cursor-pointer" onClick={() => toggleCuisine(cuisine)}>
                    {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Types de service */}
          <div>
            <Label className="text-base font-medium mb-3 block">{t('restaurantFilters.serviceTypes')}</Label>
            <Select onValueChange={toggleServiceType}>
              <SelectTrigger>
                <SelectValue placeholder={t('restaurantFilters.selectService') || "Sélectionner un service"} />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPE_OPTIONS.map(serviceType => (
                  <SelectItem key={serviceType} value={serviceType}>
                    {SERVICE_TYPES_TRANSLATIONS[serviceType as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || serviceType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.serviceTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.serviceTypes.map(serviceType => (
                  <Badge key={serviceType} variant="default" className="cursor-pointer" onClick={() => toggleServiceType(serviceType)}>
                    {SERVICE_TYPES_TRANSLATIONS[serviceType as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || serviceType}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Gamme de prix */}
          <div>
            <Label className="text-base font-medium mb-3 block">{t('restaurantFilters.priceRange')}</Label>
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
            <Label className="text-base font-medium mb-3 block">{t('restaurantFilters.period')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {DATE_RANGES.map(date => (
                <Button
                  key={date.value}
                  variant={filters.dateRange === date.value ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: date.value }))}
                >
                  {t(date.labelKey)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('restaurantFilters.options')}</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{t('restaurantFilters.showActiveOnly')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('restaurantFilters.hideDisabled')}
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
            <Label className="text-base font-medium mb-3 block">{t('restaurantFilters.sortBy')}</Label>
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
                    {t(sort.labelKey)}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            {t('restaurantFilters.reset')}
          </Button>
          <Button onClick={handleApply} className="flex-1">
            {t('restaurantFilters.apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};