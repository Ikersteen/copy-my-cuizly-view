import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";

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
  const isMobile = useIsMobile();
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
        title: t('errors.title'),
        description: t('newOffer.errors.fillTitleDescription'),
        variant: "destructive"
      });
      return;
    }

    if (!formData.discount_percentage && !formData.discount_amount) {
      toast({
        title: t('errors.title'), 
        description: t('newOffer.errors.specifyDiscount'),
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: t('errors.title'),
        description: t('newOffer.errors.fixErrors'),
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
        title: t('newOffer.success.created'),
        description: t('newOffer.success.published')
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
        title: t('errors.title'),
        description: t('newOffer.errors.cannotCreate'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Form content component to reuse in both Dialog and Drawer
  const FormContent = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">{t('newOffer.form.title')} *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder={t('newOffer.placeholders.title')}
          className={isMobile ? "min-h-[48px]" : ""}
        />
      </div>

      <div>
        <Label htmlFor="description">{t('newOffer.form.description')} *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={t('newOffer.placeholders.description')}
          rows={3}
          required
          className={isMobile ? "min-h-[100px]" : ""}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_percentage">{t('newOffer.form.discountPercent')}</Label>
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
            className={isMobile ? "min-h-[48px]" : ""}
          />
        </div>
        <div>
          <Label htmlFor="discount_amount">{t('newOffer.form.discountAmount')}</Label>
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
            className={isMobile ? "min-h-[48px]" : ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">{t('newOffer.form.category')}</Label>
        <select 
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className={`w-full px-3 py-2 border border-input bg-background rounded-md ${isMobile ? "min-h-[48px]" : ""}`}
        >
          <option value="general">{t('newOffer.categories.general')}</option>
          <option value="lunch">{t('newOffer.categories.lunch')}</option>
          <option value="dinner">{t('newOffer.categories.dinner')}</option>
          <option value="weekend">{t('newOffer.categories.weekend')}</option>
          <option value="happy_hour">{t('newOffer.categories.happyHour')}</option>
        </select>
      </div>

      <div>
        <Label htmlFor="cuisine_type">Type de cuisine</Label>
        <select 
          id="cuisine_type"
          value={formData.cuisine_type}
          onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
          className={`w-full px-3 py-2 border border-input bg-background rounded-md ${isMobile ? "min-h-[48px]" : ""}`}
        >
          <option value="">{t('newOffer.form.allTypes')}</option>
          {CUISINE_OPTIONS.map(cuisine => (
            <option key={cuisine} value={cuisine}>
              {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.fr || cuisine}
            </option>
          ))}
        </select>
      </div>

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        maxDays={3}
        label={t('newOffer.form.validPeriod')}
        placeholder={t('newOffer.placeholders.selectPeriod')}
      />

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">{t('newOffer.form.activateImmediately')}</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, is_active: checked }))
          }
        />
      </div>
    </div>
  );

  // Mobile version with Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
            <X className="h-4 w-4" />
            <span className="sr-only">{t('newOffer.cancel')}</span>
          </DrawerClose>
          
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-semibold">{t('newOffer.title')}</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            <FormContent />
          </div>

          <DrawerFooter className="pt-4 space-y-2">
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.title || !formData.description.trim()}
              className="w-full min-h-[52px] text-base"
            >
            {loading ? t('newOffer.creating') : t('newOffer.createOffer')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full min-h-[52px] text-base">
            {t('newOffer.cancel')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version with Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newOffer.title')}</DialogTitle>
        </DialogHeader>
        
        <FormContent />

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
      </DialogContent>
    </Dialog>
  );
};