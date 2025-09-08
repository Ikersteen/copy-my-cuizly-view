import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Camera, User, Trash2, Edit2, Crop, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PhotoAdjustmentModal } from "@/components/PhotoAdjustmentModal";
import { AddressSelector } from "@/components/MontrealAddressSelector";
import { useAddresses } from "@/hooks/useAddresses";
import { createAddressInput } from "@/lib/addressUtils";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS, DIETARY_OPTIONS, ALLERGEN_OPTIONS } from "@/constants/cuisineTypes";

interface ImprovedRestaurantProfileModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  // Legacy props for compatibility
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  restaurant?: any;
  onUpdate?: () => void;
}

export const ImprovedRestaurantProfileModal = ({ 
  isOpen, 
  onClose, 
  open, 
  onOpenChange, 
  onUpdate 
}: ImprovedRestaurantProfileModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { primaryAddress: restaurantAddress, createAddress, updateAddress: updateAddressHook } = useAddresses('restaurant');
  
  // Handle both prop formats
  const modalIsOpen = isOpen ?? open ?? false;
  const handleClose = onClose ?? (() => onOpenChange?.(false));
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: restaurantAddress?.formatted_address || "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modalIsOpen) {
      loadRestaurant();
    }
  }, [modalIsOpen]);

  useEffect(() => {
    if (restaurantAddress) {
      setFormData(prev => ({ ...prev, address: restaurantAddress.formatted_address }));
    }
  }, [restaurantAddress]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (error) throw error;

      setRestaurant(data);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        phone: data.phone || "",
        email: data.email || "",
        address: restaurantAddress?.formatted_address || data.address || "",
      });
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    if (!formData.name.trim()) {
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.nameRequired'),
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Update restaurant data (excluding address)
      const { address, ...restaurantData } = formData;
      
      // Handle address update separately
      if (address && address !== restaurantAddress?.formatted_address) {
        if (restaurantAddress) {
          await updateAddressHook(restaurantAddress.id!, { 
            formatted_address: address 
          });
        } else {
          await createAddress(createAddressInput(address, 'restaurant', true));
        }
      }

      // Update other restaurant data if needed
      const updateData = {
        name: restaurantData.name?.trim() || null,
        description: restaurantData.description?.trim() || null,
        phone: restaurantData.phone?.trim() || null,
        email: restaurantData.email?.trim() || null,
      };

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('owner_id', session.user.id);

      if (error) throw error;

      await loadRestaurant();
      
      toast({
        title: t('restaurantProfile.saved'),
        description: t('restaurantProfile.savedSuccessfully')
      });
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.saveError'),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={modalIsOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('restaurantProfile.title')}</DialogTitle>
          <DialogDescription>
            {t('restaurantProfile.description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('restaurantProfile.restaurantName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('restaurantProfile.restaurantNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('restaurantProfile.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('restaurantProfile.descriptionPlaceholder')}
                className="min-h-[100px]"
              />
            </div>

            <AddressSelector
              value={formData.address}
              onChange={(address) => setFormData(prev => ({ ...prev, address }))}
              label={t('restaurantProfile.address')}
              placeholder={t('restaurantProfile.addressPlaceholder')}
            />

            <div className="space-y-2">
              <Label htmlFor="phone">{t('restaurantProfile.phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (514) 465-4783"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('restaurantProfile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cuizlycanada@gmail.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                onClose?.();
                onOpenChange?.(false);
              }}>
                {t('restaurantProfile.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
                {saving ? t('restaurantProfile.saving') : t('restaurantProfile.save')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Legacy export for compatibility
export const RestaurantProfileModal = ImprovedRestaurantProfileModal;