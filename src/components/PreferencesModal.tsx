import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserPreferences, useUserPreferences } from "@/hooks/useUserPreferences";
import { X, Plus } from "lucide-react";

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

const CUISINE_OPTIONS = [
  "Française", "Italienne", "Japonaise", "Chinoise", "Mexicaine", "Indienne",
  "Thaï", "Libanaise", "Grecque", "Américaine", "Québécoise", "Coréenne",
  "Vietnamienne", "Espagnole", "Marocaine", "Turque", "Africaine"
];

const DIETARY_OPTIONS = [
  "Végétarien", "Végan", "Sans gluten", "Halal", "Casher", "Paléo",
  "Cétogène", "Sans lactose", "Pescétarien", "Faible en sodium"
];

const ALLERGEN_OPTIONS = [
  "Arachides", "Noix", "Lait", "Œufs", "Blé", "Soja", "Poisson", 
  "Fruits de mer", "Graines de sésame", "Sulfites"
];

const MEAL_TIMES = [
  "Petit-déjeuner", "Brunch", "Déjeuner", "Collation", "Dîner", "Tard le soir"
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export const PreferencesModal = ({ open, onOpenChange }: PreferencesModalProps) => {
  const { preferences, updatePreferences } = useUserPreferences();
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});

  // Réinitialiser les préférences locales à chaque ouverture du modal
  useEffect(() => {
    if (open && preferences) {
      setLocalPrefs({
        cuisine_preferences: preferences.cuisine_preferences || [],
        dietary_restrictions: preferences.dietary_restrictions || [],
        allergens: preferences.allergens || [],
        price_range: preferences.price_range || "$$",
        street: preferences.street || "",
        delivery_radius: preferences.delivery_radius || 10,
        favorite_meal_times: preferences.favorite_meal_times || [],
        notification_preferences: preferences.notification_preferences || { push: true, email: true }
      });
    }
  }, [open, preferences]);

  const handleSave = async () => {
    console.log('Saving preferences:', localPrefs);
    await updatePreferences(localPrefs);
    onOpenChange(false);
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
            Mes préférences culinaires
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cuisines préférées */}
          <div>
            <Label className="text-base font-medium">Cuisines préférées</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Sélectionnez vos types de cuisine favoris
            </p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <Badge
                  key={cuisine}
                  variant={(localPrefs.cuisine_preferences || []).includes(cuisine) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.cuisine_preferences || [], cuisine, 'cuisine_preferences')}
                >
                  {cuisine}
                  {(localPrefs.cuisine_preferences || []).includes(cuisine) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Restrictions alimentaires */}
          <div>
            <Label className="text-base font-medium">Restrictions alimentaires</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Indiquez vos préférences et restrictions alimentaires
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(diet => (
                <Badge
                  key={diet}
                  variant={(localPrefs.dietary_restrictions || []).includes(diet) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.dietary_restrictions || [], diet, 'dietary_restrictions')}
                >
                  {diet}
                  {(localPrefs.dietary_restrictions || []).includes(diet) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Allergènes */}
          <div>
            <Label className="text-base font-medium">Allergènes à éviter</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Sélectionnez vos allergies alimentaires
            </p>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map(allergen => (
                <Badge
                  key={allergen}
                  variant={(localPrefs.allergens || []).includes(allergen) ? "destructive" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.allergens || [], allergen, 'allergens')}
                >
                  {allergen}
                  {(localPrefs.allergens || []).includes(allergen) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Gamme de prix */}
          <div>
            <Label className="text-base font-medium">Gamme de prix préférée</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choisissez votre budget habituel
            </p>
            <div className="flex gap-2">
              {PRICE_RANGES.map(range => (
                <Badge
                  key={range}
                  variant={localPrefs.price_range === range ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105 text-lg px-4 py-2"
                  onClick={() => setLocalPrefs(prev => ({ ...prev, price_range: range }))}
                >
                  {range}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sélection de rue */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Votre rue à Montréal</Label>
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
              Rayon de livraison: {localPrefs.delivery_radius || 10} km
            </Label>
            <Slider
              value={[localPrefs.delivery_radius || 10]}
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
            <Label className="text-base font-medium">Moments de repas favoris</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Quand commandez-vous habituellement ?
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TIMES.map(time => (
                <Badge
                  key={time}
                  variant={(localPrefs.favorite_meal_times || []).includes(time) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => toggleArrayItem(localPrefs.favorite_meal_times || [], time, 'favorite_meal_times')}
                >
                  {time}
                  {(localPrefs.favorite_meal_times || []).includes(time) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div>
            <Label className="text-base font-medium">Préférences de notification</Label>
            <div className="space-y-4 mt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Notifications par email</Label>
                <Switch
                  id="email-notifications"
                  checked={localPrefs.notification_preferences?.email !== false}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Notifications push</Label>
                <Switch
                  id="push-notifications"
                  checked={localPrefs.notification_preferences?.push !== false}
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
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};