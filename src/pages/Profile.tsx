import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2, User, Phone, Shield, Settings, UserCog } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PhotoActionModal } from "@/components/PhotoActionModal";

const Profile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { profile, updateProfile, loading } = useProfile();
  
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('profile.description')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">{t('profile.photo')}</CardTitle>
              <CardDescription>{t('profile.photoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage 
                    src={localProfile.avatar_url} 
                    alt={`${localProfile.first_name} ${localProfile.last_name}` || t('profile.defaultName')} 
                  />
                  <AvatarFallback className="text-2xl">
                    <User className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>
                
                <Button 
                  variant="outline" 
                  onClick={() => setPhotoModalOpen(true)}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t('profile.changePhoto')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Profile Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">{t('profile.personalInfo')}</CardTitle>
              <CardDescription>{t('profile.personalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('profile.firstName')}
                  </Label>
                  <Input
                    id="first_name"
                    value={localProfile.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder={t('placeholders.firstName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('profile.lastName')}
                  </Label>
                  <Input
                    id="last_name"
                    value={localProfile.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder={t('placeholders.lastName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('profile.username')}
                  </Label>
                  <Input
                    id="username"
                    value={localProfile.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder={t('placeholders.username')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {t('profile.phone')}
                  </Label>
                  <Input
                    id="phone"
                    value={localProfile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('placeholders.phone')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('profile.preferences')}
              </CardTitle>
              <CardDescription>{t('profile.preferencesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label>{t('profile.language')}</Label>
                <Select value={currentLanguage} onValueChange={changeLanguage}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-destructive" />
                  <Label className="text-base font-medium text-destructive">{t('profile.dangerZone')}</Label>
                </div>
                
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-destructive">{t('profile.deleteAccount')}</h4>
                      <p className="text-sm text-muted-foreground">{t('profile.deleteAccountWarning')}</p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('profile.deleteAccount')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('profile.confirmDelete')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('profile.deleteConfirmation')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('profile.deleteAccount')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer avec boutons d'action */}
        <div className="flex gap-3 mt-6 max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            disabled={saving}
            className="flex-1"
          >
            {t('profile.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1"
           >
             {saving ? t('profile.saving') : t('profile.save')}
           </Button>
         </div>
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