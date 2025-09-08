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
    service_types: [] as string[],
    dietary_restrictions: [] as string[],
    allergens: [] as string[],
    opening_hours: {
      monday: { open: "09:00", close: "17:00", closed: false },
      tuesday: { open: "09:00", close: "17:00", closed: false },
      wednesday: { open: "09:00", close: "17:00", closed: false },
      thursday: { open: "09:00", close: "17:00", closed: false },
      friday: { open: "09:00", close: "17:00", closed: false },
      saturday: { open: "09:00", close: "17:00", closed: false },
      sunday: { open: "09:00", close: "17:00", closed: true }
    },
    delivery_radius: 5
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
        service_types: (data as any).service_types || [],
        dietary_restrictions: data.dietary_restrictions || [],
        allergens: data.allergens || [],
        opening_hours: (data.opening_hours && typeof data.opening_hours === 'object') ? data.opening_hours as any : {
          monday: { open: "09:00", close: "17:00", closed: false },
          tuesday: { open: "09:00", close: "17:00", closed: false },
          wednesday: { open: "09:00", close: "17:00", closed: false },
          thursday: { open: "09:00", close: "17:00", closed: false },
          friday: { open: "09:00", close: "17:00", closed: false },
          saturday: { open: "09:00", close: "17:00", closed: false },
          sunday: { open: "09:00", close: "17:00", closed: true }
        },
        delivery_radius: data.delivery_radius || 5
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

      // Update other restaurant data
      const updateData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        cuisine_type: formData.cuisine_type,
        restaurant_specialties: formData.restaurant_specialties,
        dietary_restrictions: formData.dietary_restrictions,
        allergens: formData.allergens,
        service_types: formData.service_types,
        opening_hours: formData.opening_hours,
        delivery_radius: formData.delivery_radius
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
        <DialogTitle className="sr-only">{t('restaurantProfile.title')}</DialogTitle>
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
              <Label>{t('restaurantProfile.openingHours')}</Label>
              <p className="text-sm text-muted-foreground">{t('restaurantProfile.openingHoursDesc')}</p>
              <div className="space-y-2">
                {Object.entries(formData.opening_hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-2">
                    <div className="w-20 text-sm font-medium">
                      {t(`restaurantProfile.${day}`)}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => {
                          const newHours = { ...formData.opening_hours };
                          newHours[day as keyof typeof newHours].closed = !e.target.checked;
                          setFormData(prev => ({ ...prev, opening_hours: newHours }));
                        }}
                        className="rounded border-gray-300"
                      />
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              const newHours = { ...formData.opening_hours };
                              newHours[day as keyof typeof newHours].open = e.target.value;
                              setFormData(prev => ({ ...prev, opening_hours: newHours }));
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">à</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              const newHours = { ...formData.opening_hours };
                              newHours[day as keyof typeof newHours].close = e.target.value;
                              setFormData(prev => ({ ...prev, opening_hours: newHours }));
                            }}
                            className="w-24"
                          />
                        </>
                      )}
                      {hours.closed && (
                        <span className="text-sm text-muted-foreground">{t('restaurantProfile.closed')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_radius">{t('restaurantProfile.deliveryRadius')}</Label>
              <p className="text-sm text-muted-foreground">{t('restaurantProfile.deliveryRadiusDesc')}</p>
              <Input
                id="delivery_radius"
                type="number"
                min="1"
                max="50"
                value={formData.delivery_radius}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_radius: parseInt(e.target.value) || 5 }))}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('restaurantProfile.cuisineTypes')}</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => {
                    const isSelected = formData.cuisine_type.includes(cuisine);
                    return (
                      <Button
                        key={cuisine}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="justify-start h-auto py-2 px-3 text-xs"
                        onClick={() => {
                          const newSelection = isSelected
                            ? formData.cuisine_type.filter(c => c !== cuisine)
                            : [...formData.cuisine_type, cuisine];
                          setFormData(prev => ({ ...prev, cuisine_type: newSelection }));
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${
                            isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <span className="text-xs text-primary">✓</span>}
                          </div>
                          <span className="text-left truncate">
                            {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                {formData.cuisine_type.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.cuisine_type.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs">
                        {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:bg-secondary-foreground/20 rounded" 
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
            </div>

            <div className="space-y-2">
              <Label>{t('restaurantProfile.serviceTypes')}</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICE_TYPES_OPTIONS.map((service) => {
                    const isSelected = formData.service_types.includes(service);
                    return (
                      <Button
                        key={service}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="justify-start h-auto py-2 px-3 text-xs"
                        onClick={() => {
                          const newSelection = isSelected
                            ? formData.service_types.filter(s => s !== service)
                            : [...formData.service_types, service];
                          setFormData(prev => ({ ...prev, service_types: newSelection }));
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${
                            isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <span className="text-xs text-primary">✓</span>}
                          </div>
                          <span className="text-left truncate">
                            {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || service}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                {formData.service_types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.service_types.map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || service}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:bg-secondary-foreground/20 rounded" 
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