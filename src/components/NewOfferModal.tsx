import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/DateRangePicker";
import { format } from "date-fns";
import { validateTextInput, INPUT_LIMITS } from "@/lib/validation";

interface NewOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string | null;
  onSuccess: () => void;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const NewOfferModal = ({ 
  open, 
  onOpenChange, 
  restaurantId,
  onSuccess 
}: NewOfferModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: "",
    discount_amount: "",
    category: "general",
    cuisine_type: "",
    is_active: true
  });
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const titleValidation = validateTextInput(formData.title, INPUT_LIMITS.TITLE, "Title");
    if (!titleValidation.isValid) errors.title = titleValidation.error!;

    const descValidation = validateTextInput(formData.description, INPUT_LIMITS.DESCRIPTION, "Description");
    if (!descValidation.isValid) errors.description = descValidation.error!;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!restaurantId || !formData.title || !formData.description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre et la description de l'offre",
        variant: "destructive"
      });
      return;
    }

    if (!formData.discount_percentage && !formData.discount_amount) {
      toast({
        title: "Erreur", 
        description: "Veuillez spécifier un pourcentage ou un montant de réduction",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Sanitize form data before saving
      const offerData = {
        restaurant_id: restaurantId,
        title: validateTextInput(formData.title, INPUT_LIMITS.TITLE).sanitized,
        description: validateTextInput(formData.description, INPUT_LIMITS.DESCRIPTION).sanitized || null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        valid_until: dateRange.to ? dateRange.to.toISOString() : null,
        category: formData.category,
        cuisine_type: formData.cuisine_type || null,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('offers')
        .insert(offerData);

      if (error) throw error;

      toast({
        title: "Offre créée",
        description: "Votre nouvelle offre a été publiée avec succès"
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        discount_percentage: "",
        discount_amount: "",
        category: "general",
        cuisine_type: "",
        is_active: true
      });
      setDateRange({ from: undefined, to: undefined });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'offre",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle offre</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de l'offre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Pizza 2 pour 1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre offre en détail..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_percentage">Réduction (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_percentage: e.target.value,
                  discount_amount: "" // Reset other field
                }))}
                placeholder="20"
              />
            </div>
            <div>
              <Label htmlFor="discount_amount">Réduction ($)</Label>
              <Input
                id="discount_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_amount: e.target.value,
                  discount_percentage: "" // Reset other field
                }))}
                placeholder="5.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <select 
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="general">Générale</option>
              <option value="lunch">Déjeuner</option>
              <option value="dinner">Dîner</option>
              <option value="weekend">Week-end</option>
              <option value="happy_hour">Happy Hour</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cuisine_type">Type de cuisine</Label>
            <select 
              id="cuisine_type"
              value={formData.cuisine_type}
              onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">Tous types</option>
              <option value="Italienne">Italienne</option>
              <option value="Française">Française</option>
              <option value="Chinoise">Chinoise</option>
              <option value="Japonaise">Japonaise</option>
              <option value="Mexicaine">Mexicaine</option>
              <option value="Indienne">Indienne</option>
              <option value="Libanaise">Libanaise</option>
              <option value="Thaïlandaise">Thaïlandaise</option>
              <option value="Grecque">Grecque</option>
              <option value="Américaine">Américaine</option>
              <option value="Africaine">Africaine</option>
            </select>
          </div>

          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            maxDays={3}
            label="Valide du ... au (max 3 jours)"
            placeholder="Sélectionnez la période de validité"
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Activer l'offre immédiatement</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.title || !formData.description.trim()}
              className="flex-1"
            >
              {loading ? "Création..." : "Créer l'offre"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};