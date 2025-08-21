import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Upload, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cuisine_type: string[];
  price_range: string;
  is_active: boolean;
  logo_url: string;
  cover_image_url?: string;
  delivery_radius: number;
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
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newCuisine, setNewCuisine] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (restaurant && open) {
      setFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        cuisine_type: restaurant.cuisine_type || [],
        price_range: restaurant.price_range || "$$",
        is_active: restaurant.is_active ?? true,
        logo_url: restaurant.logo_url || "",
        cover_image_url: restaurant.cover_image_url || "",
        delivery_radius: restaurant.delivery_radius || 5
      });
    }
  }, [restaurant, open]);

  const handleSave = async () => {
    if (!restaurant?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(formData)
        .eq('id', restaurant.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Les informations de votre restaurant ont été sauvegardées"
      });
      
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' = 'logo') => {
    const file = event.target.files?.[0];
    if (!file || !restaurant?.id) return;

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

    if (type === 'logo') {
      setUploading(true);
    } else {
      setUploadingCover(true);
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

      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, cover_image_url: data.publicUrl }));
      }
      
      toast({
        title: "Image uploadée",
        description: `${type === 'logo' ? 'Le logo' : 'La photo de couverture'} a été mis à jour avec succès`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader l'image",
        variant: "destructive"
      });
    } finally {
      if (type === 'logo') {
        setUploading(false);
      } else {
        setUploadingCover(false);
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

  const removeCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisine_type: prev.cuisine_type?.filter(c => c !== cuisine) || []
    }));
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur Cuizly !"
      });
      
      onOpenChange(false);
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil du restaurant</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre restaurant, logo et photo de couverture
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Logo du restaurant</Label>
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
                  <p className="text-sm text-muted-foreground">Upload du logo...</p>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Photo de couverture</Label>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full">
                  <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                    {formData.cover_image_url ? (
                      <img 
                        src={formData.cover_image_url} 
                        alt="Couverture"
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
                  <p className="text-sm text-muted-foreground">Upload de la couverture...</p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre restaurant en quelques mots..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (XXX) XXX-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@restaurant.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresse complète</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Rue de la Paix, Montréal, QC"
              />
            </div>
          </div>

          <Separator />

          {/* Cuisine Types */}
          <div className="space-y-4">
            <Label>Types de cuisine</Label>
            <div className="flex flex-wrap gap-2">
              {formData.cuisine_type?.map((cuisine, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {cuisine}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeCuisine(cuisine)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
                placeholder="Ajouter un type de cuisine"
                onKeyPress={(e) => e.key === 'Enter' && addCuisine()}
              />
              <Button onClick={addCuisine} variant="outline">
                Ajouter
              </Button>
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_range">Gamme de prix</Label>
                <select 
                  id="price_range"
                  value={formData.price_range || "$$"}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="$">$ - Économique</option>
                  <option value="$$">$$ - Modéré</option>
                  <option value="$$$">$$$ - Cher</option>
                  <option value="$$$$">$$$$ - Très cher</option>
                </select>
              </div>
              <div>
                <Label htmlFor="delivery_radius">Rayon de livraison (km)</Label>
                <Input
                  id="delivery_radius"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.delivery_radius || 5}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    delivery_radius: parseInt(e.target.value) || 5 
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Restaurant actif</Label>
              <Switch
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={loading || !formData.name}>
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};