import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2, User, Phone, Shield, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PhotoActionModal } from "@/components/PhotoActionModal";

const Profile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { profile, updateProfile, loading } = useProfile();
  const isMobile = useIsMobile();
  
  const [localProfile, setLocalProfile] = useState({
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    avatar_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setLocalProfile({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // Récupérer l'email de l'utilisateur
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUserEmail();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(localProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(profile?.id || '');
      if (error) throw error;
      
      toast({
        title: t('profile.accountDeleted'),
        description: t('profile.accountDeletedDesc')
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('toasts.error'),
        description: t('profile.deleteError'),
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      handleInputChange('avatar_url', publicUrl);
      setPhotoModalOpen(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: t('toasts.error'),
        description: 'Erreur lors du téléchargement de la photo',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    handleInputChange('avatar_url', '');
    setPhotoModalOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Contenu principal du profil
  const profileContent = (
    <div className="space-y-6">
      {/* Photo de profil */}
      <div className="flex items-center space-x-4">
        {/* Avatar à gauche */}
        <Avatar className="w-24 h-24 flex-shrink-0">
          <AvatarImage 
            src={localProfile.avatar_url} 
            alt={`${localProfile.first_name} ${localProfile.last_name}` || 'Photo de profil'} 
          />
          <AvatarFallback className="text-xl">
            <User className="w-12 h-12" />
          </AvatarFallback>
        </Avatar>
        
        {/* Informations à droite */}
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-semibold">
            {`${localProfile.first_name || ''} ${localProfile.last_name || ''}`.trim() || 'Utilisateur'}
          </h3>
          <p className="text-muted-foreground">
            {userEmail}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full max-w-xs"
            onClick={() => setPhotoModalOpen(true)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Changer la photo
          </Button>
        </div>
      </div>

      <Separator />

      {/* Informations personnelles */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Informations personnelles</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom</Label>
            <Input
              id="first_name"
              value={localProfile.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Votre prénom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Nom</Label>
            <Input
              id="last_name"
              value={localProfile.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Votre nom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={localProfile.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Votre nom d'utilisateur"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={localProfile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Votre numéro de téléphone"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Préférences */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Préférences</h2>
        
        <div className="space-y-2">
          <Label>Langue</Label>
          <Select value={currentLanguage} onValueChange={changeLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Zone de danger */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-destructive">Zone de danger</h2>
        
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="space-y-2">
            <h4 className="font-medium text-destructive">Supprimer le compte</h4>
            <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer le compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3 mt-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          disabled={saving}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex-1"
         >
           {saving ? 'Sauvegarde...' : 'Sauvegarder'}
         </Button>
       </div>
    </div>
  );

  // Affichage mobile (modal)
  if (isMobile) {
    return (
      <>
        <Dialog open={true} onOpenChange={() => navigate(-1)}>
          <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] flex flex-col mx-auto my-auto">
            <DialogHeader className="flex-shrink-0 text-center border-b pb-3">
              <DialogTitle className="text-xl font-semibold">
                Profil
              </DialogTitle>
            </DialogHeader>
            
            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              <div className="space-y-6">
                {/* Photo de profil */}
                <div className="flex items-center space-x-4">
                  {/* Avatar à gauche */}
                  <Avatar className="w-20 h-20 flex-shrink-0">
                    <AvatarImage 
                      src={localProfile.avatar_url} 
                      alt={`${localProfile.first_name} ${localProfile.last_name}` || 'Photo de profil'} 
                    />
                    <AvatarFallback className="text-lg">
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Informations à droite */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold">
                      {`${localProfile.first_name || ''} ${localProfile.last_name || ''}`.trim() || 'Utilisateur'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setPhotoModalOpen(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Changer la photo
                </Button>

                <Separator />

                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-center">Informations personnelles</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name_mobile">Prénom</Label>
                      <Input
                        id="first_name_mobile"
                        value={localProfile.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Votre prénom"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name_mobile">Nom</Label>
                      <Input
                        id="last_name_mobile"
                        value={localProfile.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Votre nom"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username_mobile">Nom d'utilisateur</Label>
                      <Input
                        id="username_mobile"
                        value={localProfile.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Votre nom d'utilisateur"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_mobile">Téléphone</Label>
                      <Input
                        id="phone_mobile"
                        value={localProfile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Votre numéro de téléphone"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Préférences */}
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-center">Préférences</h2>
                  
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select value={currentLanguage} onValueChange={changeLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Zone de danger */}
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-destructive text-center">Zone de danger</h2>
                  
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div className="space-y-2 text-center">
                      <h4 className="font-medium text-destructive">Supprimer le compte</h4>
                      <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer le compte
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Boutons d'action toujours visibles en bas */}
            <div className="flex-shrink-0 flex gap-3 p-4 border-t bg-background">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={saving}
                className="flex-1 min-h-[44px]"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 min-h-[44px]"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Action Modal */}
        <PhotoActionModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          currentImageUrl={localProfile.avatar_url}
          onUpload={handlePhotoUpload}
          onRemove={handlePhotoRemove}
          photoType="profile"
          uploading={uploading}
        />
      </>
    );
  }

  // Affichage desktop (page complète)
  return (
    <div className="min-h-screen bg-background">
      {/* Header avec titre et bouton fermer */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <h1 className="text-xl font-semibold">Profil</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 pb-safe-area-inset-bottom">
        {profileContent}
      </div>

      {/* Photo Action Modal */}
      <PhotoActionModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        currentImageUrl={localProfile.avatar_url}
        onUpload={handlePhotoUpload}
        onRemove={handlePhotoRemove}
        photoType="profile"
        uploading={uploading}
      />
    </div>
  );
};

export default Profile;