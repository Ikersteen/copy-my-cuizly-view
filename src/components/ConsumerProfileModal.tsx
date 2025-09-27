import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Upload, X, Camera, User, Trash2, Edit2, LogOut, Shield, Bell, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { useProfile } from "@/hooks/useProfile";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { validateFileUpload } from "@/lib/security";

interface ConsumerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsumerProfileModal = ({ isOpen, onClose }: ConsumerProfileModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { preferences, updatePreferences } = useUserPreferences();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    avatar_url: ""
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: false,
    push: false
  });
  
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || ""
      });
      
      setNotificationSettings({
        email: preferences?.notification_preferences?.email || false,
        push: preferences?.notification_preferences?.push || false
      });
    }
  }, [isOpen, profile, preferences]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update profile
      if (formData) {
        await updateProfile(formData);
      }
      
      // Update notification preferences
      await updatePreferences({
        notification_preferences: {
          ...preferences?.notification_preferences,
          email: notificationSettings.email,
          push: notificationSettings.push
        }
      });
      
      toast({
        title: t('profile.updateSuccess'),
        description: t('profile.updateSuccessDesc')
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profile.updateError'),
        description: t('profile.updateErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      toast({
        title: t('errors.uploadError'),
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));

      toast({
        title: t('profile.avatarUploadSuccess'),
        description: t('profile.avatarUploadSuccessDesc')
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: t('profile.avatarUploadError'),
        description: t('profile.avatarUploadErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: "" }));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onClose();
      toast({
        title: t('dashboard.logoutSuccess'),
        description: t('dashboard.logoutSuccessDesc')
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t('dashboard.logoutError'),
        description: t('dashboard.logoutErrorDesc'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    // Implementation for account deletion (30-day grace period)
    toast({
      title: t('profile.deleteAccountScheduled'),
      description: t('profile.deleteAccountScheduledDesc')
    });
    setShowDeleteModal(false);
  };

  if (profileLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
            <DialogTitle className="text-lg font-semibold flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div>{profile?.first_name ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}` : profile?.username || t('profile.title')}</div>
                <DialogDescription className="text-sm text-muted-foreground">
                  @{profile?.username || 'utilisateur'} • {profile?.phone || 'ikersteen@gmail.com'}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4">

          <div className="py-2">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden border-2 border-background shadow-lg">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt={t('profile.avatar')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 rounded-full shadow-md"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </Button>
                  {formData.avatar_url && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full shadow-md"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Personal Information */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Informations personnelles</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="first_name" className="text-sm">Prénom</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Iker"
                        className="h-9"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="last_name" className="text-sm">Nom</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Votre nom"
                        className="h-9"
                      />
                    </div>
                    </div>

                  <div className="space-y-1">
                    <Label htmlFor="username" className="text-sm">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Iker"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (514) 123-4567"
                      className="h-9"
                    />
                  </div>
                  </div>
                </div>

                {/* Security Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Sécurité et confidentialité</h3>
                  </div>
                  
                      <div className="p-3 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Mot de passe</p>
                            <p className="text-xs text-muted-foreground">Modifiez votre mot de passe pour sécuriser votre compte</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowPasswordModal(true)}
                          >
                            Modifier
                          </Button>
                        </div>
                      </div>
                </div>
              </div>

              {/* Right Column - Account Actions & Notifications */}
              <div className="space-y-6">
                {/* Account Actions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <LogOut className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Actions du compte</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Se déconnecter</p>
                          <p className="text-xs text-muted-foreground">Déconnectez-vous de votre session actuelle</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                          Se déconnecter
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-destructive">Supprimer le compte</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Votre compte sera programmé pour suppression dans 30 jours. Durant cette période, vous pouvez vous reconnecter pour annuler cette demande. Après 30 jours, toutes vos données seront définitivement supprimées.
                          </p>
                        </div>
                        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Supprimer le compte
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer votre compte ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Votre compte sera programmé pour suppression dans 30 jours. Durant cette période, vous pouvez vous reconnecter pour annuler cette demande. Après 30 jours, toutes vos données seront définitivement supprimées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer le compte
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">Notifications courriel</p>
                            <p className="text-xs text-muted-foreground">Recevez des notifications par courriel</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.email}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, email: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">Notifications push</p>
                            <p className="text-xs text-muted-foreground">Recevez des notifications sur votre appareil</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.push}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, push: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          </div>

          {/* Actions */}
          <div className="flex justify-between px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal - Placeholder */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Modifiez votre mot de passe pour sécuriser votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Un lien de réinitialisation sera envoyé à votre adresse courriel
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowPasswordModal(false)}>
              Envoyer le lien
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};