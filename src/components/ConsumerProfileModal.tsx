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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {profile?.first_name || profile?.username || t('profile.title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              @{profile?.username || 'utilisateur'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt={t('profile.avatar')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  {formData.avatar_url && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-md"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-4 w-4" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('profile.personalInfo')}</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('profile.firstName')}</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder={t('profile.firstNamePlaceholder')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('profile.lastName')}</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder={t('profile.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t('profile.username')}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={t('profile.usernamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (514) 123-4567"
                  />
                </div>

                {/* Sécurité et confidentialité */}
                <Separator className="my-6" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('profile.security')}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('profile.password')}</p>
                      <p className="text-sm text-muted-foreground">{t('profile.passwordDescription')}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {t('profile.modify')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions du compte et Notifications */}
              <div className="space-y-4">
                {/* Actions du compte */}
                <div className="flex items-center gap-2 mb-4">
                  <LogOut className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('profile.accountActions')}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('profile.logout')}</p>
                      <p className="text-sm text-muted-foreground">{t('profile.logoutDescription')}</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('profile.logout')}
                    </Button>
                  </div>

                  <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-destructive">{t('profile.deleteAccount')}</p>
                      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('profile.deleteAccount')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('profile.deleteAccountConfirm')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('profile.deleteAccountDescription')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('profile.confirmDelete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.deleteAccountExplanation')}
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                <Separator className="my-6" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t('profile.notifications')}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('profile.emailNotifications')}</p>
                        <p className="text-sm text-muted-foreground">{t('profile.emailNotificationsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('profile.pushNotifications')}</p>
                        <p className="text-sm text-muted-foreground">{t('profile.pushNotificationsDesc')}</p>
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

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal - Placeholder */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.changePassword')}</DialogTitle>
            <DialogDescription>
              {t('profile.changePasswordDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {t('profile.passwordChangeNotice')}
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => setShowPasswordModal(false)}>
              {t('profile.sendResetEmail')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};