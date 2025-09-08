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

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS, SERVICE_TYPES_OPTIONS, SERVICE_TYPES_TRANSLATIONS } from "@/constants/cuisineTypes";

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
  const { t, i18n } = useTranslation();
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
    cuisine_type: [] as string[],
    restaurant_specialties: [] as string[],
    service_types: [] as string[]
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
        cuisine_type: data.cuisine_type || [],
        restaurant_specialties: data.restaurant_specialties || [],
        service_types: (data as any).service_types || []
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
        cuisine_type: formData.cuisine_type,
        restaurant_specialties: formData.restaurant_specialties,
        service_types: formData.service_types
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

            <div className="space-y-2">
              <Label>{t('restaurantProfile.cuisineTypes')}</Label>
              <Select
                value={formData.cuisine_type.join(',')}
                onValueChange={(value) => {
                  const selected = value ? value.split(',') : [];
                  setFormData(prev => ({ ...prev, cuisine_type: selected }));
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('restaurantProfile.selectCuisineTypes')} />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.cuisine_type.includes(cuisine)}
                          onChange={() => {
                            const newSelection = formData.cuisine_type.includes(cuisine)
                              ? formData.cuisine_type.filter(c => c !== cuisine)
                              : [...formData.cuisine_type, cuisine];
                            setFormData(prev => ({ ...prev, cuisine_type: newSelection }));
                          }}
                          className="rounded"
                        />
                        {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.cuisine_type.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.cuisine_type.map((cuisine) => (
                    <Badge key={cuisine} variant="secondary" className="text-xs">
                      {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          cuisine_type: prev.cuisine_type.filter(c => c !== cuisine) 
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('restaurantProfile.serviceTypes')}</Label>
              <Select
                value={formData.service_types.join(',')}
                onValueChange={(value) => {
                  const selected = value ? value.split(',') : [];
                  setFormData(prev => ({ ...prev, service_types: selected }));
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('restaurantProfile.selectServiceTypes')} />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {SERVICE_TYPES_OPTIONS.map((service) => (
                    <SelectItem key={service} value={service}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes(service)}
                          onChange={() => {
                            const newSelection = formData.service_types.includes(service)
                              ? formData.service_types.filter(s => s !== service)
                              : [...formData.service_types, service];
                            setFormData(prev => ({ ...prev, service_types: newSelection }));
                          }}
                          className="rounded"
                        />
                        {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || service}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.service_types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.service_types.map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || service}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          service_types: prev.service_types.filter(s => s !== service) 
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">{t('restaurantProfile.specialties')}</Label>
              <Textarea
                id="specialties"
                value={formData.restaurant_specialties.join(', ')}
                onChange={(e) => {
                  const specialties = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  setFormData(prev => ({ ...prev, restaurant_specialties: specialties }));
                }}
                placeholder={t('restaurantProfile.specialtiesPlaceholder')}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                {t('restaurantProfile.specialtiesHint')}
              </p>
              {formData.restaurant_specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.restaurant_specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          restaurant_specialties: prev.restaurant_specialties.filter((_, i) => i !== index) 
                        }))}
                      />
                    </Badge>
                  ))}
                </div>
              )}
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