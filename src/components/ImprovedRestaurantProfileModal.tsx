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
import { Upload, X, Camera, User, Trash2, Edit2, Crop, ChevronDown, Instagram, Facebook, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PhotoAdjustmentModal } from "@/components/PhotoAdjustmentModal";
import { AddressSelector } from "@/components/MontrealAddressSelector";
import { useAddresses } from "@/hooks/useAddresses";
import { createAddressInput } from "@/lib/addressUtils";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS, SERVICE_TYPES_OPTIONS, SERVICE_TYPES_TRANSLATIONS, PRICE_RANGE_OPTIONS, PRICE_RANGE_TRANSLATIONS } from "@/constants/cuisineTypes";

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
    username: "",
    description: "",
    phone: "",
    email: "",
    address: restaurantAddress?.formatted_address || "",
    cuisine_type: [] as string[],
    restaurant_specialties: [] as string[],
    service_types: [] as string[],
    dietary_restrictions: [] as string[],
    allergens: [] as string[],
    instagram_url: "",
    facebook_url: "",
    price_range: "" as string,
    opening_hours: {
      monday: { open: "09:00", close: "17:00", closed: false },
      tuesday: { open: "09:00", close: "17:00", closed: false },
      wednesday: { open: "09:00", close: "17:00", closed: false },
      thursday: { open: "09:00", close: "17:00", closed: false },
      friday: { open: "09:00", close: "17:00", closed: false },
      saturday: { open: "09:00", close: "17:00", closed: false },
      sunday: { open: "09:00", close: "17:00", closed: true }
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalType, setPhotoModalType] = useState<'logo' | 'cover'>('logo');
  
  // Photo adjustment modal states
  const [logoAdjustmentOpen, setLogoAdjustmentOpen] = useState(false);
  const [coverAdjustmentOpen, setCoverAdjustmentOpen] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState<string>('');
  const [tempCoverUrl, setTempCoverUrl] = useState<string>('');

  // Debug log for modal state
  // console.log('Modal states:', { photoModalOpen, photoModalType });

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

      // Also load profile data for username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      setRestaurant(data);
      setFormData({
        name: data.name || "",
        username: profileData?.username || "",
        description: data.description || "",
        phone: data.phone || "",
        email: data.email || "",
        address: restaurantAddress?.formatted_address || data.address || "",
        cuisine_type: data.cuisine_type || [],
        restaurant_specialties: data.restaurant_specialties || [],
        instagram_url: data.instagram_url || "",
        facebook_url: data.facebook_url || "",
        service_types: (data as any).service_types || [],
        dietary_restrictions: data.dietary_restrictions || [],
        allergens: data.allergens || [],
        price_range: data.price_range || "",
        opening_hours: (data.opening_hours && typeof data.opening_hours === 'object') ? data.opening_hours as any : {
          monday: { open: "09:00", close: "17:00", closed: false },
          tuesday: { open: "09:00", close: "17:00", closed: false },
          wednesday: { open: "09:00", close: "17:00", closed: false },
          thursday: { open: "09:00", close: "17:00", closed: false },
          friday: { open: "09:00", close: "17:00", closed: false },
          saturday: { open: "09:00", close: "17:00", closed: false },
          sunday: { open: "09:00", close: "17:00", closed: true }
        }
      });
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload with adjustment modal
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    console.log('🎯 handleFileUpload called with type:', type, 'file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.selectValidImage'),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      toast({
        title: t('restaurantProfile.error'), 
        description: t('restaurantProfile.imageTooLarge'),
        variant: "destructive"
      });
      return;
    }

    console.log('✅ File validation passed, reading file...');
    
    // Convert file to URL for adjustment modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('📸 FileReader onload, result length:', result?.length);
      
      if (type === 'cover') {
        console.log('🖼️ Setting cover URL and opening modal');
        setTempCoverUrl(result);
        setCoverAdjustmentOpen(true);
        console.log('📱 Cover adjustment modal state set to true');
      } else {
        console.log('🏷️ Setting logo URL and opening modal');
        setTempLogoUrl(result);
        setLogoAdjustmentOpen(true);
        console.log('📱 Logo adjustment modal state set to true');
      }
    };
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
    };
    reader.readAsDataURL(file);
  };

  const handleAdjustedImageSave = async (adjustedImageData: string, type: 'logo' | 'cover') => {
    console.log('💾 Saving adjusted image for type:', type);
    
    if (type === 'cover') {
      setUploadingCover(true);
    } else {
      setUploadingLogo(true);
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Convert base64 to blob
      const response = await fetch(adjustedImageData);
      const blob = await response.blob();
      
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${session.user.id}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      // Update database
      const updateField = type === 'cover' ? 'cover_image_url' : 'logo_url';
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ [updateField]: data.publicUrl })
        .eq('owner_id', session.user.id);

      if (updateError) throw updateError;

      // Update form data
      setFormData(prev => ({ ...prev, [updateField]: data.publicUrl }));
      
      toast({
        title: t('restaurantProfile.profileUpdated'),
        description: type === 'cover' ? t('restaurantProfile.uploadingCover') : t('restaurantProfile.uploadingLogo')
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotUpload'),
        variant: "destructive"
      });
    } finally {
      if (type === 'cover') {
        setUploadingCover(false);
        setCoverAdjustmentOpen(false);
      } else {
        setUploadingLogo(false);
        setLogoAdjustmentOpen(false);
      }
    }
  };

  // Handle image removal
  const handleImageRemove = async (imageType: 'logo' | 'cover') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const updateField = imageType === 'logo' ? 'logo_url' : 'cover_image_url';
      
      // Update restaurant in database
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          [updateField]: null,
          updated_at: new Date().toISOString()
        })
        .eq('owner_id', session.user.id);

      if (error) throw error;

      // Update local state
      setRestaurant((prev: any) => ({
        ...prev,
        [updateField]: null
      }));

      toast({
        title: t('restaurantProfile.success'),
        description: t('restaurantProfile.imageRemoved'),
      });

      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.serverError'),
        variant: "destructive"
      });
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
        instagram_url: formData.instagram_url.trim() || null,
        facebook_url: formData.facebook_url.trim() || null,
        dietary_restrictions: formData.dietary_restrictions,
        allergens: formData.allergens,
        service_types: formData.service_types,
        price_range: formData.price_range || null,
        opening_hours: formData.opening_hours
      };

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('owner_id', session.user.id);

      if (error) throw error;

      // Update username in profiles table
      if (formData.username.trim()) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: formData.username.trim() })
          .eq('user_id', session.user.id);
        
        if (profileError) throw profileError;
      }

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
    <>
      <Dialog open={modalIsOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto [&>button]:w-8 [&>button]:h-8 p-0">
        <DialogTitle className="sr-only">Profil du restaurant</DialogTitle>
        <DialogDescription className="sr-only">
          Modifiez les informations de votre restaurant, ajoutez des photos et gérez vos paramètres.
        </DialogDescription>
        
        {/* Header with padding */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-8 pt-2 sm:pt-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">Profil du restaurant</DialogTitle>
          </DialogHeader>
        </div>

        {/* Content area */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-8 pb-2 sm:pb-4 md:pb-6">
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
            <div className="space-y-6">
            {/* Facebook-style Header with Cover Photo and Logo */}
            <div className="relative">
              {/* Cover Photo Background */}
              <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {restaurant?.cover_image_url ? (
                  <img 
                    src={restaurant.cover_image_url} 
                    alt={t('restaurantProfile.coverImageAlt')}
                    className="w-full h-full object-cover"
                  />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Camera className="h-16 w-16 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">{t('restaurantProfile.noCoverPhoto')}</p>
                    </div>
                  )}
                
                {/* Cover Photo Hover Effect Only - No Click */}
                <div className="absolute inset-0 group">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                </div>

                {/* Floating Edit Button - Always visible for better UX */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-3 right-3 bg-white hover:bg-white/90 text-gray-700 shadow-lg border z-50"
                  onMouseDown={() => console.log('🟡 Button mouse down')}
                  onMouseUp={() => console.log('🟡 Button mouse up')}
                  onClick={() => {
                    // Use file input instead
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFileUpload(e as any, 'cover');
                    input.click();
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {restaurant?.cover_image_url ? t('restaurantProfile.editCover') : t('restaurantProfile.addCover')}
                </Button>

                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* Logo and Restaurant Info Overlay */}
              <div className="absolute -bottom-6 left-6 flex items-end gap-4">
                {/* Logo */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    {restaurant?.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={t('restaurantProfile.logoAlt')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Logo Click Handler */}
                  <div 
                    className="absolute inset-0 cursor-pointer group rounded-full overflow-hidden"
                    onClick={() => {
                      // Use file input for logo
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => handleFileUpload(e as any, 'logo');
                      input.click();
                    }}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Spacer for the overlay */}
            <div className="h-8"></div>

            {/* Rest of the form */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du restaurant</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de votre restaurant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="@nomdutilisateur"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">{t('restaurantProfile.description')}</Label>
                <span className={`text-xs ${
                  formData.description.length > 280 
                    ? 'text-orange-500' 
                    : 'text-muted-foreground'
                }`}>
                  {formData.description.length}/300
                </span>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                  }
                }}
                placeholder={t('restaurantProfile.descriptionPlaceholder')}
                className="min-h-[120px]"
                maxLength={300}
              />
              {formData.description.length > 280 && (
                <p className="text-xs text-muted-foreground">
                  {300 - formData.description.length} caractères restants
                </p>
              )}
            </div>

            <AddressSelector
              value={formData.address}
              onChange={(address) => setFormData(prev => ({ ...prev, address }))}
              label="Adresse"
              placeholder="Entrez l'adresse de votre restaurant"
            />

            <div className="space-y-2">
              <Label htmlFor="phone">{t('restaurantProfile.phone')}</Label>
               <Input
                 id="phone"
                 value={formData.phone}
                 onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                 placeholder="+1 (514) 465-4783"
                 autoComplete="off"
                 autoCorrect="off"
                 autoCapitalize="off"
                 spellCheck="false"
               />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('restaurantProfile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('auth.form.emailPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram_url"
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                placeholder="https://instagram.com/votre-restaurant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_url" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook_url"
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                placeholder="https://facebook.com/votre-restaurant"
              />
            </div>

            <div className="space-y-2">
              <Label>Heures d'ouverture</Label>
              <p className="text-sm text-muted-foreground">Définissez vos heures d'ouverture pour chaque jour de la semaine</p>
              <div className="space-y-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const hours = formData.opening_hours[day as keyof typeof formData.opening_hours];
                  if (!hours) return null;
                  return (
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
                 );
                 })}
              </div>
            </div>


            <div className="space-y-2">
              <Label>Gamme de prix</Label>
              <p className="text-sm text-muted-foreground">Sélectionnez la gamme de prix qui correspond à votre restaurant</p>
              <Select 
                value={formData.price_range} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une gamme de prix" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGE_OPTIONS.map((range) => (
                    <SelectItem key={range} value={range}>
                       {PRICE_RANGE_TRANSLATIONS[range as keyof typeof PRICE_RANGE_TRANSLATIONS]?.fr || 
                        PRICE_RANGE_TRANSLATIONS[range as keyof typeof PRICE_RANGE_TRANSLATIONS]?.en || 
                        range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Types de cuisine</Label>
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
                            {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.fr || 
                             CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.en || 
                             cuisine}
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
                         {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.fr || 
                          CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.en || 
                          cuisine}
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
              <Label>Types de service</Label>
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
                            {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.fr || 
                             SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.en || 
                             service}
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
                         {SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.fr || 
                          SERVICE_TYPES_TRANSLATIONS[service as keyof typeof SERVICE_TYPES_TRANSLATIONS]?.en || 
                          service}
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
      </div>
      </DialogContent>
    </Dialog>

    {/* Photo Adjustment Modals */}
    <PhotoAdjustmentModal
      open={logoAdjustmentOpen}
      onOpenChange={setLogoAdjustmentOpen}
      imageUrl={tempLogoUrl}
      onSave={(adjustedData) => handleAdjustedImageSave(adjustedData, 'logo')}
      title={t('photoAdjustment.adjustProfilePhoto')}
    />

    <PhotoAdjustmentModal
      open={coverAdjustmentOpen}
      onOpenChange={setCoverAdjustmentOpen}
      imageUrl={tempCoverUrl}
      onSave={(adjustedData) => handleAdjustedImageSave(adjustedData, 'cover')}
      title={t('photoAdjustment.adjustCoverPhoto')}
    />
    </>
  );
};

// Legacy export for compatibility
export const RestaurantProfileModal = ImprovedRestaurantProfileModal;
