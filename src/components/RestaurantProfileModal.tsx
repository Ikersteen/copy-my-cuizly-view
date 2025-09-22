import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Upload, LogOut, Trash2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { validateTextInput, validateEmail, validatePhone, sanitizeStringArray, INPUT_LIMITS } from "@/lib/validation";
import { AddressSelector } from "@/components/MontrealAddressSelector";
import { useAddresses } from "@/hooks/useAddresses";
import { createAddressInput, formatRestaurantAddress } from "@/lib/addressUtils";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from 'react-i18next';
import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";
import { useLanguage } from '@/hooks/useLanguage';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cuisine_type: string[];
  logo_url: string;
  cover_image_url?: string;
  chef_emoji_color?: string;
  delivery_radius?: number;
  restaurant_specialties?: string[];
  dietary_restrictions?: string[];
  allergens?: string[];
}

interface RestaurantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
  onUpdate: () => void;
}

export const RestaurantProfileModal = ({ 
  open, 
  onOpenChange, 
  restaurant, 
  onUpdate 
}: RestaurantProfileModalProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { updateProfile } = useProfile();
  const { primaryAddress: restaurantAddress, createAddress, updateAddress: updateAddressHook } = useAddresses('restaurant');
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newCuisine, setNewCuisine] = useState("");
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to get translated cuisine name
  const getCuisineTranslation = (cuisineKey: string) => {
    return CUISINE_TRANSLATIONS[cuisineKey as keyof typeof CUISINE_TRANSLATIONS]?.[currentLanguage] || cuisineKey;
  };

  useEffect(() => {
    if (restaurant && open) {
      setFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: formatRestaurantAddress(restaurantAddress?.formatted_address || restaurant.address || ""),
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        cuisine_type: restaurant.cuisine_type || [],
        logo_url: restaurant.logo_url || "",
        cover_image_url: restaurant.cover_image_url || "",
        chef_emoji_color: "",
        delivery_radius: restaurant.delivery_radius || 5,
        restaurant_specialties: restaurant.restaurant_specialties || []
      });
    }
  }, [restaurant, open, restaurantAddress]);

  // Mettre à jour l'adresse quand restaurantAddress change
  useEffect(() => {
    if (restaurantAddress) {
      setFormData(prev => ({ ...prev, address: formatRestaurantAddress(restaurantAddress.formatted_address) }));
    }
  }, [restaurantAddress]);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.name) {
      const nameValidation = validateTextInput(formData.name, INPUT_LIMITS.NAME, "Restaurant name");
      if (!nameValidation.isValid) errors.name = nameValidation.error!;
    }

    if (formData.description) {
      const descValidation = validateTextInput(formData.description, INPUT_LIMITS.DESCRIPTION, "Description");
      if (!descValidation.isValid) errors.description = descValidation.error!;
    }

    if (formData.address) {
      const addressValidation = validateTextInput(formData.address, INPUT_LIMITS.ADDRESS, "Address");
      if (!addressValidation.isValid) errors.address = addressValidation.error!;
    }

    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) errors.email = emailValidation.error!;
    }

    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) errors.phone = phoneValidation.error!;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!restaurant?.id) return;
    
    if (!validateForm()) {
      toast({
        title: t('restaurantProfile.validationError'),
        description: t('restaurantProfile.validationErrorDesc'),
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Update restaurant data (excluding address)
      const { address, ...restaurantData } = {
        ...formData,
        name: formData.name ? validateTextInput(formData.name, INPUT_LIMITS.NAME).sanitized : formData.name,
        description: formData.description ? validateTextInput(formData.description, INPUT_LIMITS.DESCRIPTION).sanitized : formData.description,
        phone: formData.phone ? validateTextInput(formData.phone, INPUT_LIMITS.PHONE).sanitized : formData.phone,
        email: formData.email ? formData.email.trim().toLowerCase() : formData.email,
        cuisine_type: formData.cuisine_type ? sanitizeStringArray(formData.cuisine_type) : formData.cuisine_type,
        dietary_restrictions: formData.dietary_restrictions || [],
        allergens: formData.allergens || [],
        restaurant_specialties: formData.restaurant_specialties || []
      };

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(restaurantData)
        .eq('id', restaurant.id);

      if (updateError) throw updateError;

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


      // Force update the parent component to reflect changes
      onUpdate();

      toast({
        title: t('restaurantProfile.profileUpdated'),
        description: t('restaurantProfile.profileUpdatedDesc')
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotSave'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file || !restaurant?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.selectValidImage'),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('restaurantProfile.error'), 
        description: t('restaurantProfile.imageTooLarge'),
        variant: "destructive"
      });
      return;
    }

    if (type === 'cover') {
      setUploadingCover(true);
    } else {
      setUploading(true);
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const fileName = `${session.user.id}/${type}-${Date.now()}.${file.type.split('/')[1]}`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      if (type === 'cover') {
        setFormData(prev => ({ ...prev, cover_image_url: data.publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
      }
      
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
      } else {
        setUploading(false);
      }
    }
  };

  const addCuisine = () => {
    if (newCuisine.trim() && !formData.cuisine_type?.includes(newCuisine.trim())) {
      setFormData(prev => ({
        ...prev,
        cuisine_type: [...(prev.cuisine_type || []), newCuisine.trim()]
      }));
      setNewCuisine("");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: t('restaurantProfile.logoutSuccess'),
        description: t('restaurantProfile.logoutSuccessDesc')
      });
      
      onOpenChange(false);
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotLogout'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = t('restaurantProfile.deleteAccount');
    if (deleteConfirmation !== confirmText) {
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.confirmationError'),
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Marquer le restaurant et le profil pour suppression
      if (restaurant?.id) {
        await supabase
          .from('restaurants')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', restaurant.id);
      }
      
      toast({
        title: t('restaurantProfile.deletionRequested'),
        description: t('restaurantProfile.deletionRequestedDesc'),
        duration: 10000
      });
      
      await supabase.auth.signOut();
      onOpenChange(false);
      navigate("/");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotDelete'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil du restaurant</DialogTitle>
          <DialogDescription>
            {t('restaurantProfile.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cover Image Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('restaurantProfile.coverPhoto')}</Label>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[5/2] max-w-full rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                  {formData.cover_image_url ? (
                    <img 
                      src={formData.cover_image_url} 
                      alt={t('restaurantProfile.coverPhoto')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  className="hidden"
                />
              </div>
              {uploadingCover && (
                <p className="text-sm text-muted-foreground">{t('restaurantProfile.uploadingCover')}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Logo Section */}
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                />
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground">{t('restaurantProfile.uploadingLogo')}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du restaurant *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de votre restaurant"
              />
            </div>

            <div>
              <Label htmlFor="description">{t('restaurantProfile.description')}</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('restaurantProfile.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div>
              <AddressSelector
                value={formData.address || ""}
                onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                label="Adresse"
                placeholder="Entrez l'adresse de votre restaurant"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">{t('restaurantProfile.phone')}</Label>
                 <Input
                   id="phone"
                   value={formData.phone || ""}
                   onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                   placeholder="+1 (XXX) XXX-XXXX"
                   autoComplete="off"
                   autoCorrect="off"
                   autoCapitalize="off"
                   spellCheck="false"
                 />
              </div>
                <div>
                  <Label htmlFor="email">{t('restaurantProfile.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="cuizlycanada@gmail.com"
                  />
                </div>
            </div>
          </div>

          <Separator />

          {/* Cuisine Types */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('restaurantProfile.cuisines')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('restaurantProfile.cuisinesDesc')}
              </p>
            </div>
            
            {/* Selected cuisines display */}
            {formData.cuisine_type && formData.cuisine_type.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.cuisine_type.map((cuisine) => {
                  // Find the translation for this cuisine
                  const cuisineKey = Object.entries(CUISINE_TRANSLATIONS).find(([key, translations]) => 
                    translations.fr === cuisine || translations.en === cuisine
                  )?.[0];
                  const displayName = cuisineKey ? CUISINE_TRANSLATIONS[cuisineKey as keyof typeof CUISINE_TRANSLATIONS][currentLanguage] : cuisine;
                  
                  return (
                    <Badge key={cuisine} variant="default" className="pr-1">
                      {displayName}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          const currentTypes = formData.cuisine_type || [];
                          setFormData(prev => ({
                            ...prev,
                            cuisine_type: currentTypes.filter(c => c !== cuisine)
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Dropdown selector */}
            <div>
              <Select
                value=""
                onValueChange={(cuisine) => {
                  if (cuisine && !formData.cuisine_type?.includes(cuisine)) {
                    setFormData(prev => ({
                      ...prev,
                      cuisine_type: [...(prev.cuisine_type || []), cuisine]
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background border z-50">
                  <SelectValue placeholder={t('restaurantProfile.selectCuisine')} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {Object.entries(CUISINE_TRANSLATIONS).map(([key, translations]) => {
                    const cuisineLabel = translations[currentLanguage];
                    const isSelected = formData.cuisine_type?.includes(cuisineLabel);
                    if (isSelected) return null;
                    return (
                      <SelectItem key={key} value={cuisineLabel} className="hover:bg-muted">
                        {cuisineLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spécialité du restaurant */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('restaurantProfile.restaurantSpecialty')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('restaurantProfile.restaurantSpecialtyDesc')}
              </p>
            </div>
            
            {/* Selected specialties display */}
            {formData.restaurant_specialties && formData.restaurant_specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.restaurant_specialties.map((specialty) => {
                  // Find the translation for this specialty
                  const specialtyOptions = t('preferences.specialtyOptions', { returnObjects: true }) as Record<string, string>;
                  const specialtyKey = Object.entries(specialtyOptions).find(([key, value]) => value === specialty)?.[0];
                  const displayName = specialtyKey ? specialtyOptions[specialtyKey] : specialty;
                  
                  return (
                    <Badge key={specialty} variant="secondary" className="rounded-full text-center justify-center pr-1">
                      {displayName}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          const currentSpecialties = formData.restaurant_specialties || [];
                          setFormData(prev => ({
                            ...prev,
                            restaurant_specialties: currentSpecialties.filter(s => s !== specialty)
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Dropdown selector for specialties */}
            <div>
              <Select
                value=""
                onValueChange={(specialty) => {
                  if (specialty && !formData.restaurant_specialties?.includes(specialty)) {
                    setFormData(prev => ({
                      ...prev,
                      restaurant_specialties: [...(prev.restaurant_specialties || []), specialty]
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background border z-50">
                  <SelectValue placeholder={t('restaurantProfile.selectSpecialty')} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {Object.entries(t('preferences.specialtyOptions', { returnObjects: true }) as Record<string, string>).map(([key, label]) => {
                    const isSelected = formData.restaurant_specialties?.includes(label);
                    if (isSelected) return null;
                    return (
                      <SelectItem key={key} value={label} className="hover:bg-muted">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Section Emoji et Livraison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Rayon de livraison */}
            <div className="space-y-4">
              <Label htmlFor="delivery_radius" className="text-base font-medium">{t('restaurantProfile.deliveryRadius')}</Label>
              <Input
                id="delivery_radius"
                type="number"
                min="1"
                max="50"
                value={formData.delivery_radius || 5}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_radius: parseInt(e.target.value) || 5 }))}
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground">
                Distance maximale de livraison en kilomètres
              </p>
            </div>
          </div>


          {/* Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={loading || !formData.name}>
                {loading ? t('restaurantProfile.saving') : t('restaurantProfile.save')}
              </Button>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('restaurantProfile.logout')}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteSection(!showDeleteSection)}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('restaurantProfile.deleteAccount')}
              </Button>
            </div>

            {showDeleteSection && (
              <div className="space-y-3 p-4 border rounded-lg bg-destructive/5">
                <div className="space-y-2">
                  <Label className="text-destructive font-medium">{t('restaurantProfile.confirmDeletion')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('restaurantProfile.deletionWarning')}
                  </p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={t('restaurantProfile.deletionPlaceholder')}
                  />
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      disabled={deleteConfirmation !== t('restaurantProfile.deleteAccount')}
                      className="w-full"
                    >
                      {t('restaurantProfile.confirmDeletionButton')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('restaurantProfile.deleteAccountTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('restaurantProfile.deleteAccountDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('restaurantProfile.deleteAccountCancel')}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {t('restaurantProfile.deleteAccountConfirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};