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
  const [newMenu, setNewMenu] = useState({ description: "", image_url: "" });
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !restaurantId) return;

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

      setNewMenu(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Image téléchargée",
        description: "Votre image a été ajoutée avec succès"
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
    if (!restaurantId || !newMenu.image_url || !newMenu.description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter une image et une description",
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
      const { error } = await supabase
        .from('menus')
        .insert({
          restaurant_id: restaurantId,
          image_url: newMenu.image_url,
          description: newMenu.description.trim()
        });

      if (error) throw error;

      setNewMenu({ description: "", image_url: "" });
      await loadMenus();
      
      toast({
        title: "Menu ajouté",
        description: "Votre menu a été ajouté avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du menu:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le menu",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer vos menus</DialogTitle>
          <DialogDescription>
            Ajoutez jusqu'à 5 photos de vos menus avec leurs descriptions
          </DialogDescription>
        </DialogHeader>

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
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
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
                  <Label>Description</Label>
                  <Textarea
                    value={newMenu.description}
                    onChange={(e) => setNewMenu(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez ce menu..."
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={handleAddMenu}
                    disabled={loading || !newMenu.image_url || !newMenu.description.trim() || menus.length >= 5}
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
                      <div className="relative mb-3">
                        <img
                          src={menu.image_url}
                          alt="Menu"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Badge 
                          variant={menu.is_active ? "default" : "secondary"}
                          className="absolute top-2 right-2"
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
                          onClick={() => handleToggleActive(menu.id, menu.is_active)}
                          className="flex-1"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};