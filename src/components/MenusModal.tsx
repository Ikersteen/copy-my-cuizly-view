import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

import { CUISINE_OPTIONS, DIETARY_RESTRICTIONS_OPTIONS, DIETARY_RESTRICTIONS_TRANSLATIONS, ALLERGENS_OPTIONS, ALLERGENS_TRANSLATIONS } from "@/constants/cuisineTypes";

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type: string;
  dietary_restrictions: string[];
  allergens: string[];
  is_active: boolean;
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
    description: "", 
    image_url: "", 
    cuisine_type: "",
    dietary_restrictions: [] as string[],
    allergens: [] as string[]
  });
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const { toast } = useToast();

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

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      if (isEditing && editingMenu) {
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
    if (!restaurantId || !newMenu.image_url || !newMenu.description.trim() || !newMenu.cuisine_type.trim()) {
      toast({
        title: t('common.error'),
        description: t('menus.fillRequired'),
        variant: "destructive"
      });
      return;
    }

    if (menus.length >= 5) {
      toast({
        title: t('common.error'),
        description: t('menus.maxMenus'),
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
          description: newMenu.description.trim(),
          cuisine_type: newMenu.cuisine_type.trim(),
          dietary_restrictions: newMenu.dietary_restrictions,
          allergens: newMenu.allergens
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setNewMenu({ 
        description: "", 
        image_url: "", 
        cuisine_type: "",
        dietary_restrictions: [],
        allergens: []
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
        description: `Menu ${!isActive ? t('menus.menuActivated') : t('menus.menuDeactivated')} ${t('menus.statusChangedSuccessfully')}`
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
          allergens: editingMenu.allergens
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
          <DialogTitle>{t('menus.manageMenus')}</DialogTitle>
          <DialogDescription>
            {t('menus.addUpToFive')}
          </DialogDescription>
        </DialogHeader>

        {!restaurantId ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              {t('menusModal.restaurantNotConfigured')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('menus.completeProfile')}
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              {t('menus.close')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Ajouter un nouveau menu */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">{t('menus.addNew')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('menusModal.menuImage')}</Label>
                  <div className="flex flex-col space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploading}
                    />
                     <p className="text-xs text-muted-foreground">{t('menus.maxSize')}</p>
                     {uploading && <p className="text-sm text-muted-foreground">{t('menus.uploading')}</p>}
                    {newMenu.image_url && (
                      <div className="relative w-32 h-32">
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
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>

          <Label>Description *</Label>
          <Textarea
            value={newMenu.description}
            onChange={(e) => setNewMenu(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('menus.describeMenu')}
            className="min-h-[80px]"
            required
          />
                  
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

                  <Button 
                    onClick={handleAddMenu}
                    disabled={loading || !newMenu.image_url || !newMenu.description.trim() || !newMenu.cuisine_type.trim() || menus.length >= 5}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('menus.addThisMenu')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des menus existants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{t('menusModal.yourMenus')} ({menus.length}/5)</h3>
              <Badge variant="outline">{menus.filter(m => m.is_active).length} {t('menusModal.active')}</Badge>
            </div>

            {menus.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                   <h3 className="text-lg font-medium text-muted-foreground mb-2">
                     {t('menus.noMenusAdded')}
                   </h3>
                   <p className="text-sm text-muted-foreground">
                     {t('menus.startAdding')}
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
                            alt="Menu"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant="outline">{menu.cuisine_type}</Badge>
                        <Badge 
                          variant={menu.is_active ? "default" : "secondary"}
                        >
                          {menu.is_active ? t('menusModal.activeStatus') : t('menusModal.inactiveStatus')}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {menu.description}
                      </p>
                      
                      {(menu.dietary_restrictions?.length > 0 || menu.allergens?.length > 0) && (
                        <div className="mb-3 space-y-2">
                          {menu.dietary_restrictions?.length > 0 && (
                             <div>
                               <p className="text-xs font-medium text-muted-foreground mb-1">{t('menusModal.restrictions')}</p>
                               <div className="flex flex-wrap gap-1">
                                 {menu.dietary_restrictions.map(restriction => (
                                   <Badge key={restriction} variant="secondary" className="text-xs">
                                     {DIETARY_RESTRICTIONS_TRANSLATIONS[restriction as keyof typeof DIETARY_RESTRICTIONS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || restriction}
                                   </Badge>
                                 ))}
                               </div>
                            </div>
                          )}
                          {menu.allergens?.length > 0 && (
                             <div>
                               <p className="text-xs font-medium text-muted-foreground mb-1">{t('menusModal.allergens')}</p>
                               <div className="flex flex-wrap gap-1">
                                 {menu.allergens.map(allergen => (
                                   <Badge key={allergen} variant="destructive" className="text-xs">
                                     {ALLERGENS_TRANSLATIONS[allergen as keyof typeof ALLERGENS_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || allergen}
                                   </Badge>
                                 ))}
                               </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMenu(menu)}
                          className="flex-1"
                         >
                           {t('menus.edit')}
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
                  <h3 className="font-medium">{t('menus.editMenu')}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setEditingMenu(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('menusModal.menuImage')}</Label>
                    <div className="flex flex-col space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={uploading}
                      />
                       <p className="text-xs text-muted-foreground">{t('menus.maxSize')}</p>
                       {uploading && <p className="text-sm text-muted-foreground">{t('menus.uploading')}</p>}
                      {editingMenu.image_url && (
                        <div className="relative w-32 h-32">
                          <img
                            src={editingMenu.image_url}
                            alt={t('menusModal.preview')}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
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
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>

                    <Label>Description *</Label>
                    <Textarea
                      value={editingMenu.description}
                      onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                      placeholder={t('menus.describeMenu')}
                      className="min-h-[80px]"
                      required
                    />

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

                    <Button 
                      onClick={handleEditMenu}
                      disabled={loading || !editingMenu?.description?.trim()}
                      className="w-full"
                    >
                      {t('menus.saveChanges')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};