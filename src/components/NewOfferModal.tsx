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
        title: "Error",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    if (!formData.discount_percentage && !formData.discount_amount) {
      toast({
        title: "Error", 
        description: "Please specify a discount",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors",
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
        title: "Offer Created",
        description: "Published successfully"
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
        title: "Error",
        description: "Cannot create offer",
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
        <Label htmlFor="title">Offer Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="E.g.: 2 for 1 Pizza"
          className={isMobile ? "min-h-[48px]" : ""}
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your offer in detail..."
          rows={3}
          required
          className={isMobile ? "min-h-[100px]" : ""}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_percentage">Discount (%)</Label>
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
          <Label htmlFor="discount_amount">Discount ($)</Label>
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
        <Label htmlFor="category">Category</Label>
        <select 
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className={`w-full px-3 py-2 border border-input bg-background rounded-md ${isMobile ? "min-h-[48px]" : ""}`}
        >
          <option value="general">General</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="weekend">Weekend</option>
          <option value="happy_hour">Happy Hour</option>
        </select>
      </div>

      <div>
        <Label htmlFor="cuisine_type">Cuisine Type</Label>
        <select 
          id="cuisine_type"
          value={formData.cuisine_type}
          onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
          className={`w-full px-3 py-2 border border-input bg-background rounded-md ${isMobile ? "min-h-[48px]" : ""}`}
        >
          <option value="">All Types</option>
          {CUISINE_OPTIONS.map(cuisine => (
            <option key={cuisine} value={cuisine}>{cuisine}</option>
          ))}
        </select>
      </div>

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        maxDays={3}
        label="Valid from ... to (max 3 days)"
        placeholder="Select validity period"
      />

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Activate offer immediately</Label>
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
            <span className="sr-only">Cancel</span>
          </DrawerClose>
          
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-xl font-semibold">Create New Offer</DrawerTitle>
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
              {loading ? "Creating..." : "Create Offer"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full min-h-[52px] text-base">
              Cancel
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
          <DialogTitle>Create New Offer</DialogTitle>
        </DialogHeader>
        
        <FormContent />

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.title || !formData.description.trim()}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Offer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};