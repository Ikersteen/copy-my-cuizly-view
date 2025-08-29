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
import { useTranslation } from 'react-i18next';

import { CUISINE_OPTIONS } from "@/constants/cuisineTypes";

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
  const { t } = useTranslation();
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
        title: t('common.error'),
        description: t('newOffer.fillTitleDescription'),
        variant: "destructive"
      });
      return;
    }

    if (!formData.discount_percentage && !formData.discount_amount) {
      toast({
        title: t('common.error'), 
        description: t('newOffer.specifyDiscount'),
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
        title: t('newOffer.offerCreated'),
        description: t('newOffer.publishedSuccessfully')
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
        title: t('common.error'),
        description: t('newOffer.cannotCreate'),
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
          <DialogTitle>{t('newOffer.createNew')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">{t('newOffer.title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('newOffer.titlePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="description">{t('newOffer.description')} *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('newOffer.descriptionPlaceholder')}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_percentage">{t('newOffer.discountPercent')}</Label>
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
              <Label htmlFor="discount_amount">{t('newOffer.discountAmount')}</Label>
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
            <Label htmlFor="category">{t('newOffer.category')}</Label>
            <select 
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="general">{t('newOffer.general')}</option>
              <option value="lunch">{t('newOffer.lunch')}</option>
              <option value="dinner">{t('newOffer.dinner')}</option>
              <option value="weekend">{t('newOffer.weekend')}</option>
              <option value="happy_hour">{t('newOffer.happyHour')}</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cuisine_type">{t('newOffer.cuisineType')}</Label>
            <select 
              id="cuisine_type"
              value={formData.cuisine_type}
              onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">{t('newOffer.allTypes')}</option>
              {CUISINE_OPTIONS.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            maxDays={3}
            label={t('newOffer.validPeriod')}
            placeholder={t('newOffer.selectPeriod')}
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">{t('newOffer.activateImmediately')}</Label>
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
              {t('newOffer.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.title || !formData.description.trim()}
              className="flex-1"
            >
              {loading ? t('newOffer.creating') : t('newOffer.createOffer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};