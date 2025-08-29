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
import { MontrealAddressSelector } from "@/components/MontrealAddressSelector";
import { useProfile } from "@/hooks/useProfile";
import { CUISINE_OPTIONS } from "@/constants/cuisineTypes";

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
  const { updateProfile } = useProfile();
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

  useEffect(() => {
    if (restaurant && open) {
      setFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        cuisine_type: restaurant.cuisine_type || [],
        logo_url: restaurant.logo_url || "",
        cover_image_url: restaurant.cover_image_url || "",
        chef_emoji_color: restaurant.chef_emoji_color || "🧑‍🍳",
        delivery_radius: restaurant.delivery_radius || 5
      });
    }
  }, [restaurant, open]);

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
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Sanitize form data before saving
      const sanitizedData = {
        ...formData,
        name: formData.name ? validateTextInput(formData.name, INPUT_LIMITS.NAME).sanitized : formData.name,
        description: formData.description ? validateTextInput(formData.description, INPUT_LIMITS.DESCRIPTION).sanitized : formData.description,
        address: formData.address ? validateTextInput(formData.address, INPUT_LIMITS.ADDRESS).sanitized : formData.address,
        phone: formData.phone ? validateTextInput(formData.phone, INPUT_LIMITS.PHONE).sanitized : formData.phone,
        email: formData.email ? formData.email.trim().toLowerCase() : formData.email,
        cuisine_type: formData.cuisine_type ? sanitizeStringArray(formData.cuisine_type) : formData.cuisine_type
      };

      const { error } = await supabase
        .from('restaurants')
        .update(sanitizedData)
        .eq('id', restaurant.id);

      if (error) throw error;

      // Update the profile with chef_emoji_color if it changed using the hook
      if (formData.chef_emoji_color !== restaurant.chef_emoji_color) {
        const result = await updateProfile({ chef_emoji_color: formData.chef_emoji_color });
        if (!result?.success) {
          console.warn('Failed to update chef emoji, but restaurant data was saved');
        }
      }

      // Force update the parent component to reflect changes
      onUpdate();

      toast({
        title: "Profil mis à jour",
        description: "Les informations de votre restaurant ont été sauvegardées"
      });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
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
        title: type === 'cover' ? "Photo de couverture mise à jour" : "Logo mis à jour",
        description: type === 'cover' ? "La photo de couverture a été uploadée avec succès" : "Le logo a été uploadé avec succès"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader l'image",
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "Supprimer mon compte") {
      toast({
        title: "Erreur",
        description: "Veuillez taper exactement 'Supprimer mon compte' pour confirmer",
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
        title: "Demande de suppression enregistrée",
        description: "Votre compte sera automatiquement supprimé dans 30 jours. Vous pouvez vous reconnecter avant cette échéance pour annuler la suppression.",
        duration: 10000
      });
      
      await supabase.auth.signOut();
      onOpenChange(false);
      navigate("/");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande de suppression",
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
            Modifiez les informations de votre restaurant, votre logo et votre photo de couverture
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cover Image Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Photo de couverture</Label>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[5/2] max-w-full rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                  {formData.cover_image_url ? (
                    <img 
                      src={formData.cover_image_url} 
                      alt="Photo de couverture"
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
                <p className="text-sm text-muted-foreground">Upload de la photo de couverture...</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Logo Section */}
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre restaurant en quelques mots..."
                rows={3}
              />
            </div>

            <div>
              <MontrealAddressSelector
                value={formData.address || ""}
                onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                label="Adresse du restaurant"
                placeholder="Commencez à taper une adresse à Montréal..."
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
                  <Label htmlFor="email">Courriel</Label>
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
          <div className="space-y-4">
            <Label className="text-base font-medium">Cuisines proposées</Label>
            <p className="text-sm text-muted-foreground">
              Sélectionnez les cuisines que vous proposez (synchronisées avec les préférences consommateurs)
            </p>
            
            {/* Selected cuisines display */}
            {formData.cuisine_type && formData.cuisine_type.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.cuisine_type.map((cuisine, index) => (
                  <Badge key={index} variant="default" className="pr-1">
                    {cuisine}
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
                ))}
              </div>
            )}

            {/* Dropdown selector */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Cuisines disponibles</Label>
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
                  <span className="text-foreground">Sélectionner une cuisine</span>
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {CUISINE_OPTIONS.filter(cuisine => !formData.cuisine_type?.includes(cuisine)).map(cuisine => (
                    <SelectItem key={cuisine} value={cuisine} className="hover:bg-muted">
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Section Emoji et Livraison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emoji cuisinier */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Emoji du profil</Label>
              <p className="text-sm text-muted-foreground">
                Choisissez l'emoji qui apparaîtra sur votre profil
              </p>
              <div className="grid grid-cols-6 gap-2">
                {[
                  // Émojis de mains avec différentes couleurs
                  '👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿',
                  '🤚', '🤚🏻', '🤚🏼', '🤚🏽', '🤚🏾', '🤚🏿',
                  '🙌', '🙌🏻', '🙌🏼', '🙌🏽', '🙌🏾', '🙌🏿',
                  // Têtes jaunes avec différentes réactions
                  '😊', '😄', '😃', '😁', '😆', '😅',
                  '🙂', '🙃', '😉', '😇', '🥰', '😍',
                  '😋', '😎', '🤓', '🧐', '😏', '😌'
                ].map(emoji => (
                  <Button
                    key={emoji}
                    variant={formData.chef_emoji_color === emoji ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, chef_emoji_color: emoji }))}
                    className="text-lg h-10 w-10 p-0 hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rayon de livraison */}
            <div className="space-y-4">
              <Label htmlFor="delivery_radius" className="text-base font-medium">Rayon de livraison (km)</Label>
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
                Distance maximale pour les livraisons (1-50 km)
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
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteSection(!showDeleteSection)}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer mon compte
              </Button>
            </div>

            {showDeleteSection && (
              <div className="space-y-3 p-4 border rounded-lg bg-destructive/5">
                <div className="space-y-2">
                  <Label className="text-destructive font-medium">Confirmation de suppression</Label>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Pour confirmer, tapez exactement : <strong>"Supprimer mon compte"</strong>
                  </p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Tapez: Supprimer mon compte"
                  />
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      disabled={deleteConfirmation !== "Supprimer mon compte"}
                      className="w-full"
                    >
                      Confirmer la suppression
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement le compte ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Votre compte sera programmé pour suppression dans 30 jours. Durant cette période, 
                        vous pouvez vous reconnecter pour annuler cette demande. Après 30 jours, 
                        toutes vos données seront définitivement supprimées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Supprimer mon compte
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