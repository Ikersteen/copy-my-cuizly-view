import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPreferences, useUserPreferences } from "@/hooks/useUserPreferences";
import { X, Plus, ChevronDown } from "lucide-react";
import { CUISINE_OPTIONS } from "@/constants/cuisineTypes";
import { useTranslation } from 'react-i18next';

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Liste des rues de Montréal (échantillon)
const montrealStreets = [
  "Rue Saint-Denis", "Boulevard Saint-Laurent", "Rue Sainte-Catherine", 
  "Avenue du Mont-Royal", "Rue Sherbrooke", "Boulevard René-Lévesque",
  "Rue Saint-Jacques", "Avenue du Parc", "Rue Rachel", "Boulevard de Maisonneuve",
  "Rue Crescent", "Rue Peel", "Boulevard Décarie", "Rue Fleury",
  "Avenue Christophe-Colomb", "Rue Ontario", "Boulevard Pie-IX"
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export const PreferencesModal = ({ open, onOpenChange }: PreferencesModalProps) => {
  const { t } = useTranslation();
  const { preferences, updatePreferences } = useUserPreferences();
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});

  const DIETARY_OPTIONS = [
    { key: "vegetarian", value: t('preferences.dietaryOptions.vegetarian') },
    { key: "vegan", value: t('preferences.dietaryOptions.vegan') },
    { key: "glutenFree", value: t('preferences.dietaryOptions.glutenFree') },
    { key: "halal", value: t('preferences.dietaryOptions.halal') },
    { key: "kosher", value: t('preferences.dietaryOptions.kosher') },
    { key: "paleo", value: t('preferences.dietaryOptions.paleo') },
    { key: "keto", value: t('preferences.dietaryOptions.keto') },
    { key: "lactoseFree", value: t('preferences.dietaryOptions.lactoseFree') },
    { key: "pescatarian", value: t('preferences.dietaryOptions.pescatarian') },
    { key: "lowSodium", value: t('preferences.dietaryOptions.lowSodium') },
    { key: "fruitarian", value: t('preferences.dietaryOptions.fruitarian') },
    { key: "carnivore", value: t('preferences.dietaryOptions.carnivore') },
    { key: "detox", value: t('preferences.dietaryOptions.detox') },
    { key: "spicy", value: t('preferences.dietaryOptions.spicy') },
    { key: "notSpicy", value: t('preferences.dietaryOptions.notSpicy') },
    { key: "lowSugar", value: t('preferences.dietaryOptions.lowSugar') }
  ];

  const ALLERGEN_OPTIONS = [
    { key: "peanuts", value: t('preferences.allergenOptions.peanuts') },
    { key: "nuts", value: t('preferences.allergenOptions.nuts') },
    { key: "milk", value: t('preferences.allergenOptions.milk') },
    { key: "eggs", value: t('preferences.allergenOptions.eggs') },
    { key: "wheat", value: t('preferences.allergenOptions.wheat') },
    { key: "soy", value: t('preferences.allergenOptions.soy') },
    { key: "fish", value: t('preferences.allergenOptions.fish') },
    { key: "seafood", value: t('preferences.allergenOptions.seafood') },
    { key: "sesame", value: t('preferences.allergenOptions.sesame') },
    { key: "sulfites", value: t('preferences.allergenOptions.sulfites') },
    { key: "mustard", value: t('preferences.allergenOptions.mustard') },
    { key: "lupin", value: t('preferences.allergenOptions.lupin') },
    { key: "celery", value: t('preferences.allergenOptions.celery') },
    { key: "gluten", value: t('preferences.allergenOptions.gluten') },
    { key: "corn", value: t('preferences.allergenOptions.corn') },
    { key: "legumes", value: t('preferences.allergenOptions.legumes') },
    { key: "kiwi", value: t('preferences.allergenOptions.kiwi') },
    { key: "banana", value: t('preferences.allergenOptions.banana') },
    { key: "stoneFruits", value: t('preferences.allergenOptions.stoneFruits') }
  ];

  const MEAL_TIMES = [
    { key: "breakfast", value: t('preferences.mealTimeOptions.breakfast') },
    { key: "quickLunch", value: t('preferences.mealTimeOptions.quickLunch') },
    { key: "dinner", value: t('preferences.mealTimeOptions.dinner') },
    { key: "snack", value: t('preferences.mealTimeOptions.snack') },
    { key: "detox", value: t('preferences.mealTimeOptions.detox') },
    { key: "lateNight", value: t('preferences.mealTimeOptions.lateNight') }
  ];

  // Réinitialiser les préférences locales à chaque ouverture du modal
  useEffect(() => {
    if (open && preferences) {
      setLocalPrefs({
        cuisine_preferences: preferences.cuisine_preferences || [],
        dietary_restrictions: preferences.dietary_restrictions || [],
        allergens: preferences.allergens || [],
        price_range: preferences.price_range || "",
        street: preferences.street || "",
        delivery_radius: preferences.delivery_radius || 1,
        favorite_meal_times: preferences.favorite_meal_times || [],
        notification_preferences: preferences.notification_preferences || { push: false, email: false }
      });
    }
  }, [open, preferences]);

  const handleSave = async () => {
    try {
      console.log('Saving preferences:', localPrefs);
      await updatePreferences(localPrefs);
      
      // L'événement preferencesUpdated est déjà émis par updatePreferences()
      // Pas besoin de le réémettre ici pour éviter les doublons
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const toggleArrayItem = (array: string[], item: string, field: keyof UserPreferences) => {
    const currentArray = (localPrefs[field] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    setLocalPrefs(prev => ({ ...prev, [field]: newArray }));
  };

  if (!preferences) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('preferences.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cuisines préférées */}
          <div>
            <Label className="text-base font-medium">{t('preferences.cuisines')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.selectCuisines')}
            </p>
            
            {/* Selected cuisines display */}
            {localPrefs.cuisine_preferences && localPrefs.cuisine_preferences.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {localPrefs.cuisine_preferences.map((cuisine, index) => (
                  <Badge key={index} variant="default" className="pr-1">
                    {cuisine}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => toggleArrayItem(localPrefs.cuisine_preferences || [], cuisine, 'cuisine_preferences')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Dropdown selector */}
            <div>
              <Select
                value=""
                onValueChange={(cuisine) => {
                  if (cuisine && !localPrefs.cuisine_preferences?.includes(cuisine)) {
                    toggleArrayItem(localPrefs.cuisine_preferences || [], cuisine, 'cuisine_preferences');
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background border z-50">
                  <SelectValue placeholder={t('preferences.selectCuisine')} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {CUISINE_OPTIONS.filter(cuisine => !localPrefs.cuisine_preferences?.includes(cuisine)).map(cuisine => (
                    <SelectItem key={cuisine} value={cuisine} className="hover:bg-muted">
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Restrictions alimentaires */}
          <div>
            <Label className="text-base font-medium">{t('preferences.dietaryRestrictions')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.dietaryRestrictionsDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.sort((a, b) => a.value.localeCompare(b.value)).map(diet => (
                <Badge
                  key={diet.key}
                  variant={(localPrefs.dietary_restrictions || []).includes(diet.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.dietary_restrictions || [], diet.value, 'dietary_restrictions')}
                >
                  {diet.value}
                  {(localPrefs.dietary_restrictions || []).includes(diet.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Allergènes */}
          <div>
            <Label className="text-base font-medium">{t('preferences.allergens')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.allergensDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.sort((a, b) => a.value.localeCompare(b.value)).map(allergen => (
                <Badge
                  key={allergen.key}
                  variant={(localPrefs.allergens || []).includes(allergen.value) ? "destructive" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.allergens || [], allergen.value, 'allergens')}
                >
                  {allergen.value}
                  {(localPrefs.allergens || []).includes(allergen.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Gamme de prix */}
          <div>
            <Label className="text-base font-medium">{t('preferences.priceRange')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.priceRangeDesc')}
            </p>
            
            <Select
              value={localPrefs.price_range || ""}
              onValueChange={(range) => setLocalPrefs(prev => ({ ...prev, price_range: range }))}
            >
              <SelectTrigger className="w-full bg-background border z-50">
                <SelectValue placeholder={t('preferences.selectPriceRange')} />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="$" className="hover:bg-muted">{t('preferences.priceRanges.economic')}</SelectItem>
                <SelectItem value="$$" className="hover:bg-muted">{t('preferences.priceRanges.moderate')}</SelectItem>
                <SelectItem value="$$$" className="hover:bg-muted">{t('preferences.priceRanges.elevated')}</SelectItem>
                <SelectItem value="$$$$" className="hover:bg-muted">{t('preferences.priceRanges.luxury')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sélection de rue */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('preferences.street')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {montrealStreets.map(street => (
                <Badge
                  key={street}
                  variant={localPrefs.street === street ? "default" : "outline"}
                  className="cursor-pointer justify-center text-xs py-1"
                  onClick={() => setLocalPrefs(prev => ({ ...prev, street }))}
                >
                  {street}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Rayon de livraison */}
          <div>
            <Label className="text-base font-medium">
              {t('preferences.deliveryRadius')}: {localPrefs.delivery_radius || 1}
            </Label>
            <Slider
              value={[localPrefs.delivery_radius || 1]}
              onValueChange={([value]) => setLocalPrefs(prev => ({ ...prev, delivery_radius: value }))}
              max={25}
              min={1}
              step={1}
              className="mt-3"
            />
          </div>

          <Separator />

          {/* Moments de repas favoris */}
          <div>
            <Label className="text-base font-medium">{t('preferences.mealTimes')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.mealTimesDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TIMES.map(time => (
                <Badge
                  key={time.key}
                  variant={(localPrefs.favorite_meal_times || []).includes(time.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.favorite_meal_times || [], time.value, 'favorite_meal_times')}
                >
                  {time.value}
                  {(localPrefs.favorite_meal_times || []).includes(time.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div>
            <Label className="text-base font-medium">{t('preferences.notifications')}</Label>
            <div className="space-y-4 mt-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <Label htmlFor="push-notifications" className="font-medium">{t('preferences.pushNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('preferences.pushNotificationsDesc')}</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={localPrefs.notification_preferences?.push === true}
                  onCheckedChange={(checked) =>
                    setLocalPrefs(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        push: checked
                      } as any
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">{t('preferences.emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('preferences.emailNotificationsDesc')}</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={localPrefs.notification_preferences?.email === true}
                  onCheckedChange={(checked) =>
                    setLocalPrefs(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        email: checked
                      } as any
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {t('preferences.cancel')}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {t('preferences.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};