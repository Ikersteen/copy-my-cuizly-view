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
import { MontrealAddressSelector } from "@/components/MontrealAddressSelector";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS, DIETARY_OPTIONS, ALLERGEN_OPTIONS } from "@/constants/cuisineTypes";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  description_fr?: string;
  description_en?: string;
  address: string;
  phone?: string;
  email?: string;
  cuisine_type?: string[];
  dietary_restrictions?: string[];
  allergens?: string[];
  price_range?: string;
  opening_hours?: any;
  delivery_radius?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  logo_url?: string;
  cover_image_url?: string;
  restaurant_specialties?: string[];
}

interface RestaurantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
  onUpdate: () => void;
}

export const RestaurantProfileModal = ({ open, onOpenChange, restaurant, onUpdate }: RestaurantProfileModalProps) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableCuisines] = useState(CUISINE_OPTIONS);
  const [chefEmojiColor, setChefEmojiColor] = useState("🧑‍🍳");
  const [showPhotoAdjustment, setShowPhotoAdjustment] = useState(false);
  const [adjustmentImageUrl, setAdjustmentImageUrl] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<'logo' | 'cover'>('logo');
  const { toast } = useToast();

  const chefEmojis = [
    "🧑‍🍳", "👨‍🍳", "👩‍🍳", 
    "🧑🏻‍🍳", "👨🏻‍🍳", "👩🏻‍🍳",
    "🧑🏼‍🍳", "👨🏼‍🍳", "👩🏼‍🍳",
    "🧑🏽‍🍳", "👨🏽‍🍳", "👩🏽‍🍳",
    "🧑🏾‍🍳", "👨🏾‍🍳", "👩🏾‍🍳",
    "🧑🏿‍🍳", "👨🏿‍🍳", "👩🏿‍🍳"
  ];

  useEffect(() => {
    if (restaurant && open) {
      // Only update formData if we don't have unsaved changes or it's a different restaurant
      const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(restaurant);
      if (!hasUnsavedChanges || restaurant.id !== formData.id) {
        setFormData({...restaurant});
        loadChefEmoji();
      }
    }
  }, [restaurant?.id, open]);

  const loadChefEmoji = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('profiles')
        .select('chef_emoji_color')
        .eq('user_id', session.user.id)
        .single();

      if (data?.chef_emoji_color) {
        setChefEmojiColor(data.chef_emoji_color);
      }
    } catch (error) {
      console.error('Error loading chef emoji:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.selectValidImage'),
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('restaurantProfile.error'), 
        description: t('restaurantProfile.imageTooLarge'),
        variant: "destructive"
      });
      return;
    }

    // Convert file to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      setAdjustmentImageUrl(base64Image);
      setAdjustmentType(type);
      setShowPhotoAdjustment(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAdjustedPhoto = async (adjustedImageData: string) => {
    if (adjustmentType === 'cover') {
      setUploadingCover(true);
    } else {
      setUploading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !restaurant) throw new Error('No session or restaurant');

      // Convert base64 to blob
      const base64Data = adjustedImageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const fileName = `${session.user.id}/${adjustmentType}-adjusted-${Date.now()}.jpeg`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;
      console.log('Image uploaded successfully:', imageUrl);

      // Update formData
      if (adjustmentType === 'cover') {
        setFormData(prev => ({ ...prev, cover_image_url: imageUrl }));
      } else {
        setFormData(prev => ({ ...prev, logo_url: imageUrl }));
      }
      
      // Auto-save the image to database immediately
      const updateField = adjustmentType === 'cover' ? 'cover_image_url' : 'logo_url';
      const { error: dbError } = await supabase
        .from('restaurants')
        .update({ [updateField]: imageUrl })
        .eq('id', restaurant.id);

      if (dbError) {
        console.error('Error saving image to database:', dbError);
        toast({
          title: t('restaurantProfile.error'),
          description: t('restaurantProfile.cannotSave'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('restaurantProfile.profileUpdated'),
          description: adjustmentType === 'cover' ? t('restaurantProfile.coverUpdated') : t('restaurantProfile.logoUpdated')
        });
        // Trigger parent component update
        onUpdate();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotUpload'),
        variant: "destructive"
      });
    } finally {
      if (adjustmentType === 'cover') {
        setUploadingCover(false);
      } else {
        setUploading(false);
      }
      setShowPhotoAdjustment(false);
    }
  };

  const handleRemovePhoto = async (type: 'logo' | 'cover') => {
    if (!restaurant) return;
    
    try {
      // Update formData immediately for UI
      if (type === 'cover') {
        setFormData(prev => ({ ...prev, cover_image_url: null }));
      } else {
        setFormData(prev => ({ ...prev, logo_url: null }));
      }
      
      // Auto-save the removal to database
      const updateField = type === 'cover' ? 'cover_image_url' : 'logo_url';
      const { error } = await supabase
        .from('restaurants')
        .update({ [updateField]: null })
        .eq('id', restaurant.id);

      if (error) {
        console.error('Error removing image from database:', error);
        toast({
          title: t('restaurantProfile.error'),
          description: t('restaurantProfile.cannotSave'),
          variant: "destructive"
        });
        // Revert the change on error
        if (type === 'cover') {
          setFormData(prev => ({ ...prev, cover_image_url: restaurant.cover_image_url }));
        } else {
          setFormData(prev => ({ ...prev, logo_url: restaurant.logo_url }));
        }
      } else {
        toast({
          title: t('restaurantProfile.profileUpdated'),
          description: type === 'cover' ? t('restaurantProfile.coverRemoved') : t('restaurantProfile.logoRemoved')
        });
        // Trigger parent component update
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const handleChefEmojiChange = async (emoji: string) => {
    setChefEmojiColor(emoji);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('🧑‍🍳 Updating chef emoji to:', emoji, 'for user:', session.user.id);

      const { error } = await supabase
        .from('profiles')
        .update({ chef_emoji_color: emoji })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating chef emoji:', error);
        toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotSave'),
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Chef emoji updated successfully');
    } catch (error) {
      console.error('Error updating emoji:', error);
    }
  };

  const addCuisine = (cuisine: string) => {
    if (cuisine.trim() && !formData.cuisine_type?.includes(cuisine.trim())) {
      setFormData(prev => ({
        ...prev,
        cuisine_type: [...(prev.cuisine_type || []), cuisine.trim()]
      }));
    }
  };

  const removeCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisine_type: prev.cuisine_type?.filter(c => c !== cuisine) || []
    }));
  };

  const handleSave = async () => {
    if (!restaurant || !formData.name?.trim()) {
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.validationErrorDesc'),
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Prepare update data with null for empty strings
        const updateData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          description_fr: formData.description_fr?.trim() || null,
          description_en: formData.description_en?.trim() || null,
          address: formData.address?.trim() || null,
          phone: formData.phone?.trim() || null,
          email: formData.email?.trim() || null,
          cuisine_type: formData.cuisine_type || [],
          price_range: formData.price_range || null,
          logo_url: formData.logo_url?.trim() || null,
          cover_image_url: formData.cover_image_url?.trim() || null,
          delivery_radius: Number(formData.delivery_radius) || 5,
          restaurant_specialties: formData.restaurant_specialties || []
        };

      console.log('Updating restaurant with data:', updateData);

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: t('restaurantProfile.profileUpdated'),
        description: t('restaurantProfile.profileUpdatedDesc')
      });
      
      onUpdate();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Reload pour retourner à l'état non connecté
  };

  const handleDeleteAccount = async () => {
    if (!restaurant) return;
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: false })
        .eq('id', restaurant.id);

      if (error) throw error;

      toast({
        title: t('restaurantProfile.profileUpdated'),
        description: t('restaurantProfile.profileUpdatedDesc')
      });
      
      await supabase.auth.signOut();
      window.location.reload(); // Reload pour retourner à l'état non connecté
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('restaurantProfile.error'),
        description: t('restaurantProfile.cannotDelete'),
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('restaurantProfile.title')}</DialogTitle>
          <DialogDescription>
            {t('restaurantProfile.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Photo Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('restaurantProfile.coverPhoto')}</h3>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'cover')}
                className="hidden"
                id="cover-upload"
              />
              <label htmlFor="cover-upload" className="cursor-pointer block">
                <div className="w-full h-32 bg-muted rounded-xl overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                  {formData.cover_image_url ? (
                    <img 
                      src={formData.cover_image_url} 
                      alt={t('restaurantProfile.coverPhoto')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t('restaurantProfile.coverPhoto')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              
              {formData.cover_image_url && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => handleRemovePhoto('cover')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-background rounded-full p-2 shadow-lg border">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Logo Controls */}
              <div className="absolute -bottom-2 -right-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={uploading}
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
              </div>
              
              {formData.logo_url && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => handleRemovePhoto('logo')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="name">{t('restaurantProfile.restaurantName')}</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('restaurantProfile.restaurantNamePlaceholder')}
                  onFocus={(e) => {
                    // Move cursor to end instead of selecting all text
                    setTimeout(() => {
                      const input = e.target as HTMLInputElement;
                      input.setSelectionRange(input.value.length, input.value.length);
                    }, 0);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('restaurantProfile.description')}</Label>
                <Textarea
                  key={`description-${i18n.language}`}
                  id="description"
                  value={i18n.language === 'en' ? (formData.description_en || "") : (formData.description_fr || "")}
                  onChange={(e) => {
                    if (i18n.language === 'en') {
                      setFormData(prev => ({ ...prev, description_en: e.target.value }));
                    } else {
                      setFormData(prev => ({ ...prev, description_fr: e.target.value }));
                    }
                  }}
                  placeholder={t('restaurantProfile.descriptionPlaceholder')}
                  className="min-h-[100px]"
                />
              </div>

              <MontrealAddressSelector
                value={formData.address || ""}
                onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                label={t('restaurantProfile.address')}
                placeholder={t('restaurantProfile.addressPlaceholder')}
              />
            </div>

            {/* Contact & Details */}
            <div className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('restaurantProfile.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (514) 465-4783"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('restaurantProfile.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cuizlycanada@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">{t('preferences.priceRange')}</Label>
                <Select
                  value={formData.price_range || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('preferences.selectPriceRange')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">{t('preferences.priceRanges.economic')}</SelectItem>
                    <SelectItem value="$$">{t('preferences.priceRanges.moderate')}</SelectItem>
                    <SelectItem value="$$$">{t('preferences.priceRanges.elevated')}</SelectItem>
                    <SelectItem value="$$$$">{t('preferences.priceRanges.luxury')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_radius">{t('restaurantProfile.deliveryRadius')}</Label>
                <Input
                  id="delivery_radius"
                  type="number"
                  value={formData.delivery_radius || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    delivery_radius: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  min="1"
                  max="50"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Cuisine Types */}
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">{t('restaurantProfile.cuisines')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('restaurantProfile.cuisinesDesc')}
              </p>
            </div>
            
            {/* Selected cuisines display */}
            {formData.cuisine_type && formData.cuisine_type.length > 0 && (
              <div className="flex flex-wrap gap-2">
                 {formData.cuisine_type.map((cuisine) => (
                   <Badge key={cuisine} variant="default" className="pr-1">
                     {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                       onClick={() => removeCuisine(cuisine)}
                     >
                       <X className="h-3 w-3" />
                     </Button>
                   </Badge>
                 ))}
              </div>
            )}

            {/* Dropdown selector */}
            <div>
              <Select
                key={`cuisine-select-${formData.cuisine_type?.length || 0}`}
                value=""
                onValueChange={(cuisine) => {
                  if (cuisine && !formData.cuisine_type?.includes(cuisine)) {
                    const newCuisines = [...(formData.cuisine_type || []), cuisine];
                    setFormData(prev => ({
                      ...prev,
                      cuisine_type: newCuisines
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background border z-50">
                  <SelectValue placeholder={t('restaurantProfile.selectCuisine')} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {availableCuisines
                    .filter(cuisine => !formData.cuisine_type?.includes(cuisine))
                    .map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine} className="hover:bg-muted">
                        {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spécialité du restaurant */}
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">{t('restaurantProfile.restaurantSpecialty')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('restaurantProfile.restaurantSpecialtyDesc')}
              </p>
            </div>
            
            {/* Selected specialties display */}
            {formData.restaurant_specialties && formData.restaurant_specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                 {formData.restaurant_specialties.map((specialty, index) => {
                   // Trouver la traduction correspondante pour l'affichage
                   const specialtyOptions = t('preferences.specialtyOptions', { returnObjects: true }) as Record<string, string>;
                   const displayLabel = specialty;
                   
                   return (
                   <Badge key={`${specialty}-${index}`} variant="secondary" className="rounded-full text-center justify-center pr-1">
                     {displayLabel}
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         setFormData(prev => ({
                           ...prev,
                           restaurant_specialties: (prev.restaurant_specialties || []).filter((_, i) => i !== index)
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
                key={`specialty-selector-${formData.restaurant_specialties?.length || 0}`}
                value=""
                onValueChange={(specialty) => {
                  if (specialty && !formData.restaurant_specialties?.includes(specialty)) {
                    const newSpecialties = [...(formData.restaurant_specialties || []), specialty];
                    setFormData(prev => ({
                      ...prev,
                      restaurant_specialties: newSpecialties
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background border z-50">
                  <SelectValue placeholder={t('restaurantProfile.selectSpecialty')} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {(() => {
                    const specialtyOptions = t('preferences.specialtyOptions', { returnObjects: true }) as Record<string, string>;
                    const availableOptions = Object.entries(specialtyOptions)
                      .filter(([key, label]) => !formData.restaurant_specialties?.includes(label));
                    
                    return availableOptions.map(([key, label]) => (
                      <SelectItem key={`${key}-${label}`} value={label} className="hover:bg-muted">
                        {label}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Chef Emoji Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('restaurantProfile.profileEmoji')}</h3>
            <div className="grid grid-cols-6 gap-2">
              {chefEmojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant={chefEmojiColor === emoji ? "default" : "outline"}
                  className="h-12 w-12 p-0 text-xl"
                  onClick={() => handleChefEmojiChange(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4 pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogout}>
              Se déconnecter
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Supprimer mon compte</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer définitivement le compte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Votre compte sera programmé pour suppression dans 30 jours. Durant cette période, vous pouvez vous reconnecter pour annuler cette demande. Après 30 jours, toutes vos données seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    Supprimer mon compte
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.name}>
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        {/* Photo Adjustment Modal */}
        <PhotoAdjustmentModal
          open={showPhotoAdjustment}
          onOpenChange={setShowPhotoAdjustment}
          imageUrl={adjustmentImageUrl}
          onSave={handleAdjustedPhoto}
          title={adjustmentType === 'cover' ? t('restaurantProfile.coverPhoto') : t('restaurantProfile.logo')}
        />
      </DialogContent>
    </Dialog>
  );
};