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

interface Menu {
  id: string;
  image_url: string;
  description: string;
  cuisine_type: string;
  is_active: boolean;
}

interface MenusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string | null;
  onSuccess?: () => void;
}

export const MenusModal = ({ open, onOpenChange, restaurantId, onSuccess }: MenusModalProps) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newMenu, setNewMenu] = useState({ description: "", image_url: "", cuisine_type: "" });
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
        title: "Erreur",
        description: "Impossible de charger les menus",
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
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur", 
        description: "L'image doit faire moins de 5MB",
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
        title: "Image téléchargée avec succès",
        description: "Votre image a été uploadée (Limite: 5MB maximum)",
        duration: 3000
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddMenu = async () => {
    if (!restaurantId || !newMenu.image_url || !newMenu.description.trim() || !newMenu.cuisine_type.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter une image, une description et un type de cuisine",
        variant: "destructive"
      });
      return;
    }

    if (menus.length >= 5) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 5 menus maximum",
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
          cuisine_type: newMenu.cuisine_type.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setNewMenu({ description: "", image_url: "", cuisine_type: "" });
      
      // Reload menus to ensure we have the latest data
      await loadMenus();
      
      // Call parent callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      toast({
        title: "Menu ajouté avec succès !",
        description: `Votre menu "${data.description}" est maintenant visible dans votre liste`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du menu:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le menu. Veuillez réessayer.",
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
        title: "Menu supprimé",
        description: "Le menu a été supprimé avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le menu",
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
        title: "Statut modifié",
        description: `Menu ${!isActive ? 'activé' : 'désactivé'} avec succès`
      });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
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
          image_url: editingMenu.image_url
        })
        .eq('id', editingMenu.id);

      if (error) throw error;

      await loadMenus();
      setEditingMenu(null);
      toast({
        title: "Menu modifié",
        description: "Les modifications ont été sauvegardées"
      });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le menu",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer vos menus</DialogTitle>
          <DialogDescription>
            Ajoutez jusqu'à 5 photos de vos menus avec leurs descriptions
          </DialogDescription>
        </DialogHeader>

        {!restaurantId ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Votre restaurant n'est pas encore configuré. 
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez d'abord compléter les informations de votre restaurant dans "Profil du restaurant".
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Ajouter un nouveau menu */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">Ajouter un nouveau menu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Image du menu</Label>
                  <div className="flex flex-col space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">Taille maximum: 5MB</p>
                    {uploading && <p className="text-sm text-muted-foreground">Téléchargement en cours...</p>}
                    {newMenu.image_url && (
                      <div className="relative w-32 h-32">
                        <img
                          src={newMenu.image_url}
                          alt="Aperçu"
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
                  <Label>Type de cuisine</Label>
                  <select
                    value={newMenu.cuisine_type}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, cuisine_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="Italienne">Italienne</option>
                    <option value="Française">Française</option>
                    <option value="Chinoise">Chinoise</option>
                    <option value="Japonaise">Japonaise</option>
                    <option value="Mexicaine">Mexicaine</option>
                    <option value="Indienne">Indienne</option>
                    <option value="Libanaise">Libanaise</option>
                    <option value="Thaïlandaise">Thaïlandaise</option>
                    <option value="Grecque">Grecque</option>
                    <option value="Américaine">Américaine</option>
                    <option value="Africaine">Africaine</option>
                  </select>

                  <Label>Description</Label>
                  <Textarea
                    value={newMenu.description}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez ce menu..."
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddMenu}
                    disabled={loading || !newMenu.image_url || !newMenu.description.trim() || !newMenu.cuisine_type.trim() || menus.length >= 5}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter ce menu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des menus existants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Vos menus ({menus.length}/5)</h3>
              <Badge variant="outline">{menus.filter(m => m.is_active).length} actifs</Badge>
            </div>

            {menus.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Aucun menu ajouté
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Commencez par ajouter des photos de vos menus
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
                          {menu.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {menu.description}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMenu(menu)}
                          className="flex-1"
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(menu.id, menu.is_active)}
                        >
                          {menu.is_active ? "Désactiver" : "Activer"}
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
                  <h3 className="font-medium">Modifier le menu</h3>
                  <Button variant="ghost" size="sm" onClick={() => setEditingMenu(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image du menu</Label>
                    <div className="flex flex-col space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={uploading}
                      />
                      <p className="text-xs text-muted-foreground">Taille maximum: 5MB</p>
                      {uploading && <p className="text-sm text-muted-foreground">Téléchargement en cours...</p>}
                      {editingMenu.image_url && (
                        <div className="relative w-32 h-32">
                          <img
                            src={editingMenu.image_url}
                            alt="Aperçu"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de cuisine</Label>
                    <select
                      value={editingMenu.cuisine_type}
                      onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, cuisine_type: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="Italienne">Italienne</option>
                      <option value="Française">Française</option>
                      <option value="Chinoise">Chinoise</option>
                      <option value="Japonaise">Japonaise</option>
                      <option value="Mexicaine">Mexicaine</option>
                      <option value="Indienne">Indienne</option>
                      <option value="Libanaise">Libanaise</option>
                      <option value="Thaïlandaise">Thaïlandaise</option>
                      <option value="Grecque">Grecque</option>
                      <option value="Américaine">Américaine</option>
                      <option value="Africaine">Africaine</option>
                    </select>

                    <Label>Description</Label>
                    <Textarea
                      value={editingMenu.description}
                      onChange={(e) => setEditingMenu(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                      placeholder="Décrivez ce menu..."
                      className="min-h-[80px]"
                    />
                    <Button 
                      onClick={handleEditMenu}
                      disabled={loading || !editingMenu.description.trim() || !editingMenu.cuisine_type.trim()}
                      className="w-full"
                    >
                      Sauvegarder les modifications
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