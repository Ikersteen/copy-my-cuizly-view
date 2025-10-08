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
import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { AddressSelector } from "@/components/MontrealAddressSelector";
import { useAddresses } from "@/hooks/useAddresses";
import { useToast } from "@/hooks/use-toast";

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Montreal streets list (sample)
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
  const { currentLanguage } = useLanguage();
  const { preferences, updatePreferences, getDeliveryAddress, updateDeliveryAddress, deleteDeliveryAddress } = useUserPreferences();
  const { primaryAddress: deliveryAddress } = useAddresses('user_delivery');
  const { toast } = useToast();
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});

  // Function to get translated cuisine name
  const getCuisineTranslation = (cuisineKey: string) => {
    return CUISINE_TRANSLATIONS[cuisineKey as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisineKey;
  };

  // Function to get cuisine key from translated name
  const getCuisineKey = (translatedName: string) => {
    const entry = Object.entries(CUISINE_TRANSLATIONS).find(([_, translations]) => 
      translations.fr === translatedName || translations.en === translatedName
    );
    return entry ? entry[0] : translatedName;
  };

  // Dietary options with keys for storage
  const DIETARY_KEYS = [
    "vegetarian", "vegan", "glutenFree", "halal", "kosher", "paleo",
    "keto", "lactoseFree", "pescatarian", "lowSodium", "fruitarian",
    "carnivore", "detox", "spicy", "notSpicy", "lowSugar"
  ];

  const ALLERGEN_KEYS = [
    "peanuts", "nuts", "milk", "eggs", "wheat", "soy", "fish",
    "seafood", "sesame", "sulfites", "mustard", "lupin", "celery",
    "gluten", "corn", "legumes", "kiwi", "banana", "stoneFruits"
  ];

  const MEAL_TIME_KEYS = [
    "breakfast", "quickLunch", "dinner", "snack", "detox", "lateNight"
  ];

  // Helper functions to get translated values
  const getDietaryLabel = (key: string) => t(`preferences.dietaryOptions.${key}`);
  const getAllergenLabel = (key: string) => t(`preferences.allergenOptions.${key}`);
  const getMealTimeLabel = (key: string) => t(`preferences.mealTimeOptions.${key}`);

  // Reset local preferences on modal open
  useEffect(() => {
    if (open && preferences) {
      setLocalPrefs({
        cuisine_preferences: preferences.cuisine_preferences || [],
        dietary_restrictions: preferences.dietary_restrictions || [],
        allergens: preferences.allergens || [],
        price_range: preferences.price_range || "",
        delivery_radius: preferences.delivery_radius || 1,
        favorite_meal_times: preferences.favorite_meal_times || [],
        notification_preferences: preferences.notification_preferences || { push: false, email: false }
      });
    }
  }, [open, preferences]);

  const handleSave = async () => {
    try {
      console.log('Saving preferences:', localPrefs);
      
      // Update main preferences (excluding legacy address fields)
      const { street, full_address, neighborhood, postal_code, ...prefsToSave } = localPrefs;
      await updatePreferences(prefsToSave);
      
      // Handle delivery address changes
      const currentAddress = deliveryAddress?.formatted_address || "";
      const newAddress = (localPrefs as any).full_address || "";
      
      if (newAddress && newAddress !== currentAddress) {
        // User provided a new address - update it
        await updateDeliveryAddress(newAddress);
      } else if (!newAddress && currentAddress) {
        // User cleared the address - delete it
        console.log('Deleting delivery address...');
        await deleteDeliveryAddress();
      }
      
    onOpenChange(false);
    toast({
      title: t('toasts.preferencesUpdated'),
      description: t('toasts.preferencesSavedSuccessfully')
    });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: t('toasts.error'),
        description: t('preferences.saveError'),
        variant: "destructive"
      });
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
          {/* Preferred cuisines */}
          <div>
            <Label className="text-base font-medium">{t('preferences.preferredCuisines')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.preferredCuisinesDesc')}
            </p>
            
            {/* Selected cuisines display */}
            {localPrefs.cuisine_preferences && localPrefs.cuisine_preferences.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {localPrefs.cuisine_preferences.map((cuisine, index) => (
                  <Badge key={index} variant="default" className="pr-1">
                    {getCuisineTranslation(cuisine)}
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
                <SelectTrigger className="w-full bg-background border focus:ring-0 focus:ring-offset-0 focus:outline-none">
                  <SelectValue placeholder={t('preferences.selectCuisine')} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {CUISINE_OPTIONS.filter(cuisine => !localPrefs.cuisine_preferences?.includes(cuisine)).map(cuisine => (
                    <SelectItem key={cuisine} value={cuisine} className="hover:bg-muted">
                      {getCuisineTranslation(cuisine)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dietary restrictions */}
          <div>
            <Label className="text-base font-medium">{t('preferences.dietaryRestrictions')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.dietaryRestrictionsDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_KEYS.sort((a, b) => getDietaryLabel(a).localeCompare(getDietaryLabel(b))).map(key => {
                const label = getDietaryLabel(key);
                return (
                  <Badge
                    key={key}
                    variant={(localPrefs.dietary_restrictions || []).includes(label) ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-200 hover:scale-105"
                    onClick={() => toggleArrayItem(localPrefs.dietary_restrictions || [], label, 'dietary_restrictions')}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Allergens */}
          <div>
            <Label className="text-base font-medium">{t('preferences.allergens')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.allergensDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_KEYS.sort((a, b) => getAllergenLabel(a).localeCompare(getAllergenLabel(b))).map(key => {
                const label = getAllergenLabel(key);
                return (
                  <Badge
                    key={key}
                    variant={(localPrefs.allergens || []).includes(label) ? "destructive" : "outline"}
                    className="cursor-pointer transition-all duration-200 hover:scale-105"
                    onClick={() => toggleArrayItem(localPrefs.allergens || [], label, 'allergens')}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Price range */}
          <div>
            <Label className="text-base font-medium">{t('preferences.priceRange')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.priceRangeDesc')}
            </p>
            
            <Select
              value={localPrefs.price_range || ""}
              onValueChange={(range) => setLocalPrefs(prev => ({ ...prev, price_range: range }))}
            >
              <SelectTrigger className="w-full bg-background border focus:ring-0 focus:ring-offset-0 focus:outline-none">
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

          {/* Delivery address */}
          <div>
            <AddressSelector
              value={deliveryAddress?.formatted_address || ""}
              onChange={(address) => {
                setLocalPrefs(prev => ({
                  ...prev,
                  full_address: address
                }));
              }}
              label={t('preferences.deliveryAddress')}
              placeholder={t('preferences.enterAddress')}
            />
            {deliveryAddress?.formatted_address && (
              <p className="text-xs text-muted-foreground mt-2">
                📍 {t('preferences.selectedAddress')}: {deliveryAddress.formatted_address}
              </p>
            )}
          </div>

          <Separator />

          {/* Favorite meal times */}
          <div>
            <Label className="text-base font-medium">{t('preferences.mealTimes')}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t('preferences.mealTimesDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TIME_KEYS.map(key => {
                const label = getMealTimeLabel(key);
                return (
                  <Badge
                    key={key}
                    variant={(localPrefs.favorite_meal_times || []).includes(label) ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-200 hover:scale-105"
                    onClick={() => toggleArrayItem(localPrefs.favorite_meal_times || [], label, 'favorite_meal_times')}
                  >
                    {label}
                  </Badge>
                );
              })}
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