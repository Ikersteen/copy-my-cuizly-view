import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Trash2, ArrowLeft, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS, DIETARY_RESTRICTIONS_OPTIONS, DIETARY_RESTRICTIONS_TRANSLATIONS, ALLERGENS_OPTIONS, ALLERGENS_TRANSLATIONS } from "@/constants/cuisineTypes";

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type: string;
  dietary_restrictions: string[];
  allergens: string[];
  is_active: boolean;
}

interface Restaurant {
  id: string;
  user_id?: string;
  name?: string;
}

interface Profile {
  id: string;
  user_type: string;
}

const ManageMenus = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
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

  // Initialize user and profile
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          navigate("/auth");
          return;
        }

        setUser(currentUser);

        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (!profileData || profileData.user_type !== 'restaurant_owner') {
          navigate("/dashboard");
          return;
        }

        setProfile(profileData);

        // Get restaurant
        try {
          const restaurantQuery = await supabase
            .from('restaurants')
            .select('id, name, user_id')
            .eq('user_id', currentUser.id)
            .single();

          if (restaurantQuery.data) {
            setRestaurant(restaurantQuery.data);
          }
        } catch (err) {
          console.error('No restaurant found');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [navigate]);

  // Load menus when restaurant is loaded
  useEffect(() => {
    if (restaurant?.id) {
      loadMenus();
    }
  }, [restaurant?.id]);

  const loadMenus = async () => {
    if (!restaurant?.id) return;
    
    setLoadingMenus(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurant.id)
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
    } finally {
      setLoadingMenus(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = event.target.files?.[0];
    if (!file || !restaurant?.id) return;

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
      const fileName = `${restaurant.id}/${Date.now()}.${fileExt}`;

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
    if (!restaurant?.id || !newMenu.image_url || !newMenu.description.trim() || !newMenu.cuisine_type.trim()) {
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

    setLoadingMenus(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .insert({
          restaurant_id: restaurant.id,
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
      setLoadingMenus(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="space-y-2">
            <p className="text-cuizly-neutral font-medium">Chargement...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-cuizly-primary">{t('menus.manageMenus')}</h1>
            <p className="text-cuizly-neutral">{t('menus.addUpToFive')}</p>
          </div>
        </div>

        {!restaurant ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {t('menusModal.restaurantNotConfigured')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('menus.completeProfile')}
              </p>
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                {t('common.back')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Add New Menu */}
            <Card>
              <CardHeader>
                <CardTitle>{t('menus.addNew')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('menusModal.menuImage')}</Label>
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

                    <div className="space-y-2">
                      <Label>{t('cuisines.typeLabel')}</Label>
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
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('cuisines.descriptionLabel')}</Label>
                      <Textarea
                        value={newMenu.description}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t('cuisines.describeMenu')}
                        className="min-h-[80px]"
                        required
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
                      disabled={loadingMenus || !newMenu.image_url || !newMenu.description.trim() || !newMenu.cuisine_type.trim() || menus.length >= 5}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('menus.addThisMenu')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Existing Menus */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('menusModal.yourMenus')} ({menus.length}/5)</CardTitle>
                  <Badge variant="outline">{menus.filter(m => m.is_active).length} {t('menusModal.active')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {menus.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {t('menus.noMenusAdded')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('menus.startAdding')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <Badge variant="outline">
                              {CUISINE_TRANSLATIONS[menu.cuisine_type as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || menu.cuisine_type}
                            </Badge>
                            <Badge 
                              variant={menu.is_active ? "default" : "secondary"}
                            >
                              {menu.is_active ? t('menusModal.activeStatus') : t('menusModal.inactiveStatus')}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground mb-3">
                            {menu.description}
                          </p>
                          
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMenu(menu)}
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              {t('menus.editMenu')}
                            </Button>
                            <Button
                              variant={menu.is_active ? "secondary" : "default"}
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
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMenus;
