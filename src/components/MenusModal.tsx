import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { PhotoAdjustmentModal } from "@/components/PhotoAdjustmentModal";

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS, DIETARY_RESTRICTIONS_OPTIONS, DIETARY_RESTRICTIONS_TRANSLATIONS, ALLERGENS_OPTIONS, ALLERGENS_TRANSLATIONS, CATEGORY_TRANSLATIONS } from "@/constants/cuisineTypes";

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type: string;
  dietary_restrictions: string[];
  allergens: string[];
  is_active: boolean;
  category?: string;
  subcategory?: string;
  pdf_menu_url?: string;
}

interface MenusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string | null;
  onSuccess?: () => void;
}

export const MenusModal = ({ open, onOpenChange, restaurantId, onSuccess }: MenusModalProps) => {
  const { t, i18n } = useTranslation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newMenu, setNewMenu] = useState({ 
    image_url: "", 
    cuisine_type: "",
    dietary_restrictions: [] as string[],
    allergens: [] as string[],
    category: "",
    subcategory: "",
    pdf_menu_url: ""
  });
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [photoAdjustmentOpen, setPhotoAdjustmentOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  const { toast } = useToast();
  const newMenuFileInputRef = useRef<HTMLInputElement>(null);
  const editMenuFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && restaurantId) {
      loadMenus();
    }
  }, [open, restaurantId]);

  const loadMenus = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des menus:', error);
      toast({
        title: t('common.error'),
        description: t('menus.cannotLoad'),
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = event.target.files?.[0];
    if (!file || !restaurantId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: t('menus.selectValidImage'),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error'), 
        description: t('menus.imageTooLarge'),
        variant: "destructive"
      });
      return;
    }

    // Convert file to URL for adjustment modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageUrl(e.target?.result as string);
      setIsEditingImage(isEditing);
      setPhotoAdjustmentOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64Data: string): Blob => {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleAdjustedImageSave = async (adjustedImageData: string) => {
    if (!restaurantId) return;
    
    setUploading(true);
    try {
      // Convert base64 to blob directly (avoiding CSP issues)
      const blob = base64ToBlob(adjustedImageData);
      
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      if (isEditingImage && editingMenu) {
        setEditingMenu(prev => prev ? ({ ...prev, image_url: publicUrl }) : null);
      } else {
        setNewMenu(prev => ({ ...prev, image_url: publicUrl }));
      }
      
      toast({
        title: t('menus.imageUploaded'),
        description: t('menus.imageSizeLimit'),
        duration: 3000
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: t('common.error'),
        description: t('menus.cannotUpload'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddMenu = async () => {
    if (!restaurantId || !newMenu.image_url || !newMenu.cuisine_type.trim()) {
      toast({
        title: t('common.error'),
        description: t('menus.fillRequired'),
        variant: "destructive"
      });
      return;
    }

    if (menus.length >= 200) {
      toast({
        title: t('common.error'),
        description: t('menus.maxMenus200'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .insert({
          restaurant_id: restaurantId,
          image_url: newMenu.image_url,
          description: "",
          cuisine_type: newMenu.cuisine_type.trim(),
          dietary_restrictions: newMenu.dietary_restrictions,
          allergens: newMenu.allergens,
          category: newMenu.category?.trim() || null,
          subcategory: newMenu.subcategory?.trim() || null,
          pdf_menu_url: newMenu.pdf_menu_url?.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setNewMenu({ 
        image_url: "", 
        cuisine_type: "",
        dietary_restrictions: [],
        allergens: [],
        category: "",
        subcategory: "",
        pdf_menu_url: ""
      });
      
      // Reload menus to ensure we have the latest data
      await loadMenus();
      
      // Call parent callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: t('menus.menuAdded'),
        description: t('menusModal.menuAddedDesc'),
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du menu:', error);
      toast({
        title: t('common.error'),
        description: t('menus.cannotAdd'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    try {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', menuId);

      if (error) throw error;

      await loadMenus();
      toast({
        title: t('menus.menuDeleted'),
        description: t('menus.deletedSuccessfully')
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: t('common.error'),
        description: t('menus.cannotDelete'),
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (menuId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('menus')
        .update({ is_active: !isActive })
        .eq('id', menuId);

      if (error) throw error;

      await loadMenus();
      toast({
        title: t('menus.statusChanged'),
        description: !isActive ? t('menus.menuActivatedDesc') : t('menus.menuDeactivatedDesc')
      });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: t('common.error'),
        description: t('menus.cannotChangeStatus'),
        variant: "destructive"
      });
    }
  };

  const handleEditMenu = async () => {
    if (!editingMenu) return;

    try {
      const { error } = await supabase
        .from('menus')
        .update({
          description: editingMenu.description,
          cuisine_type: editingMenu.cuisine_type,
          image_url: editingMenu.image_url,
          dietary_restrictions: editingMenu.dietary_restrictions,
          allergens: editingMenu.allergens,
          category: editingMenu.category?.trim() || null,
          subcategory: editingMenu.subcategory?.trim() || null,
          pdf_menu_url: editingMenu.pdf_menu_url?.trim() || null
        })
        .eq('id', editingMenu.id);

      if (error) throw error;

      await loadMenus();
      setEditingMenu(null);
      toast({
        title: t('menus.menuModified'),
        description: t('menusModal.changesDesc')
      });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: t('common.error'),
        description: t('menus.cannotModify'),
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('menusModal.title')}</DialogTitle>
        </DialogHeader>

        {!restaurantId ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              {t('menusModal.restaurantNotConfigured')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('filters.completeProfile')}
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              {t('filters.close')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Add a new menu */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">{t('menusModal.addNewMenu')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {newMenu.image_url && (
                    <div className="relative w-full aspect-video">
                      <img
                        src={newMenu.image_url}
                        alt={t('menusModal.preview')}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => setNewMenu(prev => ({ ...prev, image_url: "" }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('menusModal.menuImage')}</Label>
                    <input
                      ref={newMenuFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => newMenuFileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {newMenu.image_url ? t('common.changeImage') : t('common.chooseFile')}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t('menusModal.maxSize')}</p>
                    {uploading && <p className="text-sm text-muted-foreground">{t('menusModal.uploading')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('menusModal.cuisineType')}</Label>
                    <select
                      value={newMenu.cuisine_type}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, cuisine_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="">{t('menusModal.selectCuisineType')}</option>
                      {CUISINE_OPTIONS.map(cuisine => (
                        <option key={cuisine} value={cuisine}>
                          {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('menusModal.mainDish') || "Plat principal"}</Label>
                    <Input
                      value={newMenu.category}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, category: e.target.value }))}
                      placeholder={t('menusModal.categoryPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('menusModal.description') || "Description"}</Label>
                    <Input
                      value={newMenu.subcategory}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, subcategory: e.target.value }))}
                      placeholder={t('menusModal.subcategoryPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('menusModal.pdfMenuUrl')}</Label>
                    <Input
                      type="url"
                      value={newMenu.pdf_menu_url}
                      onChange={(e) => setNewMenu(prev => ({ ...prev, pdf_menu_url: e.target.value }))}
                      placeholder={t('menusModal.pdfMenuUrlPlaceholder')}
                    />
                  </div>
                   
                <div className="space-y-2">
                  <Label>{t('menusModal.dietaryCompatible')}</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[40px]">
                    {DIETARY_RESTRICTIONS_OPTIONS.sort().map(restriction => (
                          <Badge
                            key={restriction}
                            variant={newMenu.dietary_restrictions.includes(restriction) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setNewMenu(prev => ({
                                ...prev,
                                dietary_restrictions: prev.dietary_restrictions.includes(restriction)
                                  ? prev.dietary_restrictions.filter(r => r !== restriction)
                                  : [...prev.dietary_restrictions, restriction]
                              }));
                            }}
                          >
                            {DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']}
                          </Badge>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label>{t('menusModal.allergensPresent')}</Label>
                   <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[40px]">
                    {ALLERGENS_OPTIONS.sort().map(allergen => (
                      <Badge
                        key={allergen}
                        variant={newMenu.allergens.includes(allergen) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setNewMenu(prev => ({
                            ...prev,
                            allergens: prev.allergens.includes(allergen)
                              ? prev.allergens.filter(a => a !== allergen)
                              : [...prev.allergens, allergen]
                          }));
                        }}
                      >
                        {ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']}
                      </Badge>
                     ))}
                   </div>
                 </div>

                   <Button
                     onClick={handleAddMenu}
                     disabled={loading || !newMenu.image_url || !newMenu.cuisine_type.trim() || menus.length >= 200}
                     className="w-full"
                   >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {t('menusModal.addThisMenu')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

           {/* Liste des menus existants */}
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="font-medium">{t('menusModal.yourMenus')} ({menus.length}/200)</h3>
              <Badge variant="outline">{menus.filter(m => m.is_active).length} {t('menusModal.active')}</Badge>
            </div>

            {menus.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                   <h3 className="text-lg font-medium text-muted-foreground mb-2">
                     {t('menusModal.noMenuAdded')}
                   </h3>
                   <p className="text-sm text-muted-foreground">
                     {t('menusModal.startAdding')}
                   </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menus.map((menu) => (
                  <Card key={menu.id} className="relative">
                    <CardContent className="p-4">
                      {menu.image_url && (
                        <div className="relative mb-3">
                          <img
                            src={menu.image_url}
                            alt={t('restaurantMenu.ourMenus')}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                        <div className="space-y-1.5 text-left mb-4">
                          <div className="text-sm text-foreground">
                            <span className="text-muted-foreground">{t('menusModal.cuisineType')} :</span> {CUISINE_TRANSLATIONS[menu.cuisine_type as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || menu.cuisine_type}
                          </div>
                          
                          {menu.category && (
                            <div className="text-sm text-foreground">
                              {CATEGORY_TRANSLATIONS[menu.category as keyof typeof CATEGORY_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || menu.category}{menu.subcategory && <span> › {menu.subcategory}</span>}
                            </div>
                          )}
                          
                          {menu.dietary_restrictions?.length > 0 && (
                            <div className="text-sm text-foreground">
                              <span className="text-muted-foreground">{t('menusModal.dietaryCompatible')} :</span> {menu.dietary_restrictions.map(restriction => 
                                DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']
                              ).join(', ')}
                            </div>
                          )}
                          
                          {menu.allergens?.length > 0 && (
                            <div className="text-sm text-foreground">
                              <span className="text-muted-foreground">{t('menusModal.allergensPresent')} :</span> {menu.allergens.map(allergen => 
                                ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']
                              ).join(', ')}
                            </div>
                          )}
                          
                          {menu.pdf_menu_url && (
                            <div className="mt-2">
                              <a 
                                href={menu.pdf_menu_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                              >
                                📄 {t('menusModal.viewMenu')}
                              </a>
                            </div>
                          )}
                        </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMenu(menu)}
                          className="flex-1"
                          >
                            {t('menusModal.edit')}
                          </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleToggleActive(menu.id, menu.is_active)}
                          >
                            {menu.is_active ? t('menusModal.deactivate') : t('menusModal.activate')}
                          </Button>
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={() => handleDeleteMenu(menu.id)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
           </div>

           {/* Modal de modification */}
           {editingMenu && (
             <Card className="mt-6">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{t('menusModal.editMenu')}</h3>
                   <Button variant="ghost" size="sm" onClick={() => setEditingMenu(null)}>
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
                 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {editingMenu.image_url && (
                          <div className="relative w-full aspect-video">
                            <img
                              src={editingMenu.image_url}
                              alt={t('menusModal.preview')}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t('menusModal.menuImage')}</Label>
                          <input
                            ref={editMenuFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            disabled={uploading}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => editMenuFileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {editingMenu.image_url ? t('common.changeImage') : t('common.chooseFile')}
                          </Button>
                          <p className="text-xs text-muted-foreground">{t('menusModal.maxSize')}</p>
                          {uploading && <p className="text-sm text-muted-foreground">{t('menusModal.uploading')}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>{t('menusModal.cuisineType')}</Label>
                          <select
                            value={editingMenu.cuisine_type}
                            onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, cuisine_type: e.target.value }) : null)}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md"
                          >
                            <option value="">{t('menusModal.selectCuisineType')}</option>
                            {CUISINE_OPTIONS.map(cuisine => (
                              <option key={cuisine} value={cuisine}>
                                {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t('menusModal.mainDish') || "Plat principal"}</Label>
                          <Input
                            value={editingMenu.category || ""}
                            onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                            placeholder={t('menusModal.categoryPlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('menusModal.description') || "Description"}</Label>
                          <Input
                            value={editingMenu.subcategory || ""}
                            onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, subcategory: e.target.value }) : null)}
                            placeholder={t('menusModal.subcategoryPlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('menusModal.pdfMenuUrl')}</Label>
                          <Input
                            type="url"
                            value={editingMenu.pdf_menu_url || ""}
                            onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, pdf_menu_url: e.target.value }) : null)}
                            placeholder={t('menusModal.pdfMenuUrlPlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('menusModal.dietaryCompatible')}</Label>
                          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[40px]">
                            {DIETARY_RESTRICTIONS_OPTIONS.sort().map(restriction => (
                              <Badge
                                key={restriction}
                                variant={editingMenu.dietary_restrictions?.includes(restriction) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditingMenu(prev => prev ? ({
                                    ...prev,
                                    dietary_restrictions: prev.dietary_restrictions?.includes(restriction)
                                      ? prev.dietary_restrictions.filter(r => r !== restriction)
                                      : [...(prev.dietary_restrictions || []), restriction]
                                  }) : null);
                                }}
                              >
                                {DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>{t('menusModal.allergensPresent')}</Label>
                          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[40px]">
                            {ALLERGENS_OPTIONS.sort().map(allergen => (
                              <Badge
                                key={allergen}
                                variant={editingMenu.allergens?.includes(allergen) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditingMenu(prev => prev ? ({
                                    ...prev,
                                    allergens: prev.allergens?.includes(allergen)
                                      ? prev.allergens.filter(a => a !== allergen)
                                      : [...(prev.allergens || []), allergen]
                                  }) : null);
                                }}
                              >
                                {ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en']}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button 
                          onClick={handleEditMenu}
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          {t('menusModal.saveChanges')}
                        </Button>
                      </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </DialogContent>
      
      {/* Photo Adjustment Modal */}
      <PhotoAdjustmentModal
        open={photoAdjustmentOpen}
        onOpenChange={setPhotoAdjustmentOpen}
        imageUrl={tempImageUrl}
        onSave={handleAdjustedImageSave}
        title={t('photoAdjustment.adjustMenuPhoto')}
      />
    </Dialog>
  );
};