import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, X, Camera, User, Trash2, Edit2, Crop } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PhotoAdjustmentModal } from "@/components/PhotoAdjustmentModal";
import { MontrealAddressSelector } from "@/components/MontrealAddressSelector";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  is_active: boolean;
  logo_url: string;
  cover_image_url?: string;
  phone: string;
  email: string;
  price_range: string;
  delivery_radius: number;
}

interface RestaurantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
  onUpdate: () => void;
}

export const RestaurantProfileModal = ({ open, onOpenChange, restaurant, onUpdate }: RestaurantProfileModalProps) => {
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCuisine, setNewCuisine] = useState("");
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
    if (restaurant) {
      setFormData(restaurant);
      loadChefEmoji();
    }
  }, [restaurant]);

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
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur", 
        description: "L'image doit faire moins de 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary URL for adjustment
    const tempUrl = URL.createObjectURL(file);
    setAdjustmentImageUrl(tempUrl);
    setAdjustmentType(type);
    setShowPhotoAdjustment(true);
  };

  const handleAdjustedPhoto = async (adjustedImageData: string) => {
    if (adjustmentType === 'cover') {
      setUploadingCover(true);
    } else {
      setUploading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

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

      if (adjustmentType === 'cover') {
        setFormData(prev => ({ ...prev, cover_image_url: imageUrl }));
      } else {
        setFormData(prev => ({ ...prev, logo_url: imageUrl }));
      }
      
      toast({
        title: adjustmentType === 'cover' ? "Photo de couverture mise à jour" : "Logo mis à jour",
        description: "L'image a été uploadée avec succès"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader l'image",
        variant: "destructive"
      });
    } finally {
      if (adjustmentType === 'cover') {
        setUploadingCover(false);
      } else {
        setUploading(false);
      }
      // Clean up the temporary URL
      URL.revokeObjectURL(adjustmentImageUrl);
    }
  };

  const handleRemovePhoto = (type: 'logo' | 'cover') => {
    if (type === 'cover') {
      setFormData(prev => ({ ...prev, cover_image_url: null }));
    } else {
      setFormData(prev => ({ ...prev, logo_url: null }));
    }
    toast({
      title: type === 'cover' ? "Photo de couverture supprimée" : "Logo supprimé",
      description: "L'image a été retirée du profil. N'oubliez pas de sauvegarder."
    });
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
          title: "Erreur",
          description: "Impossible de mettre à jour l'emoji",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Chef emoji updated successfully');
      toast({
        title: "Emoji mis à jour",
        description: "Votre emoji cuisinier a été modifié"
      });
    } catch (error) {
      console.error('Error updating emoji:', error);
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

  const handleSave = async () => {
    if (!restaurant || !formData.name?.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du restaurant est requis",
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
        address: formData.address?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        cuisine_type: formData.cuisine_type || [],
        price_range: formData.price_range || null,
        logo_url: formData.logo_url?.trim() || null,
        cover_image_url: formData.cover_image_url?.trim() || null,
        delivery_radius: Number(formData.delivery_radius) || 5
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
        title: "Profil mis à jour",
        description: "Les informations ont été sauvegardées"
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
        title: "Compte désactivé",
        description: "Votre compte restaurant a été désactivé"
      });
      
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil du restaurant</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre restaurant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                  <div className="w-full h-full rounded-full bg-cuizly-surface flex items-center justify-center">
                    <User className="h-8 w-8 text-cuizly-neutral" />
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
              <h3 className="font-semibold text-foreground">Informations de base</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nom du restaurant</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de votre restaurant"
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre restaurant..."
                  className="min-h-[100px]"
                />
              </div>

              <MontrealAddressSelector
                value={formData.address || ""}
                onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                label="Adresse du restaurant"
                placeholder="Commencez à taper votre adresse à Montréal..."
              />
            </div>

            {/* Contact & Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Contact & Détails</h3>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (514) 465-4783"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Courriel</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cuizlycanada@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">Gamme de prix</Label>
                <select
                  id="price_range"
                  value={formData.price_range || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Sélectionner</option>
                  <option value="$">$ - Économique</option>
                  <option value="$$">$$ - Modéré</option>
                  <option value="$$$">$$$ - Cher</option>
                  <option value="$$$$">$$$$ - Très cher</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_radius">Rayon de livraison (km)</Label>
                <Input
                  id="delivery_radius"
                  type="number"
                  value={formData.delivery_radius || 5}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_radius: parseInt(e.target.value) }))}
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Cuisine Types */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Types de cuisine</h3>
            
            <div className="flex flex-wrap gap-2">
              {formData.cuisine_type?.map((cuisine, index) => (
                <Badge key={index} variant="outline" className="pr-1">
                  {cuisine}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeCuisine(cuisine)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )) || []}
            </div>

            <div className="flex gap-2">
              <Input
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
                placeholder="Ajouter un type de cuisine..."
                onKeyPress={(e) => e.key === 'Enter' && addCuisine()}
              />
              <Button onClick={addCuisine} disabled={!newCuisine.trim()}>
                Ajouter
              </Button>
            </div>
          </div>

          {/* Chef Emoji Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Emoji Cuisinier</h3>
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
              Déconnexion
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Supprimer le compte</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action désactivera votre compte restaurant. Vous pourrez le réactiver en nous contactant.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    Supprimer
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
          title={adjustmentType === 'cover' ? "Ajuster la photo de couverture" : "Ajuster le logo"}
        />
      </DialogContent>
    </Dialog>
  );
};