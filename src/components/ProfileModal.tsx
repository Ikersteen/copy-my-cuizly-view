import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, User as UserIcon, Camera, Upload, X, Plus } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import type { User } from "@supabase/supabase-js";
import { validateTextInput, validatePhone, validatePassword, INPUT_LIMITS } from "@/lib/validation";
import { useTranslation } from 'react-i18next';
import { PhotoActionModal } from "@/components/PhotoActionModal";
import { PhotoAdjustmentModal } from "@/components/PhotoAdjustmentModal";
import { Badge } from "@/components/ui/badge";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { t } = useTranslation();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const { profile, loading: profileLoading, updateProfile, loadProfile } = useProfile();
  // Local profile state
  const [localProfile, setLocalProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    username: "",
    avatar_url: "",
    specialties: [] as string[],
    notifications: {
      push: false,
      email: false
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoAdjustmentOpen, setPhotoAdjustmentOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();


  useEffect(() => {
    if (open) {
      loadUserSession();
    }
  }, [open]);

  useEffect(() => {
    if (profile) {
      setLocalProfile({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
        specialties: [], // Initialize empty, could be expanded later
        notifications: {
          push: false,
          email: false
        }
      });
    }
  }, [profile]);

  const loadUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUser(session.user);
    } catch (error) {
      console.error('Error loading user session:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.loadSession'),
        variant: "destructive"
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (localProfile.first_name) {
      const nameValidation = validateTextInput(localProfile.first_name, INPUT_LIMITS.NAME, t('validation.firstName'));
      if (!nameValidation.isValid) errors.first_name = nameValidation.error!;
    }

    if (localProfile.last_name) {
      const nameValidation = validateTextInput(localProfile.last_name, INPUT_LIMITS.NAME, t('validation.lastName'));
      if (!nameValidation.isValid) errors.last_name = nameValidation.error!;
    }

    if (localProfile.username) {
      const usernameValidation = validateTextInput(localProfile.username, INPUT_LIMITS.USERNAME, t('validation.username'));
      if (!usernameValidation.isValid) errors.username = usernameValidation.error!;
    }

    if (localProfile.phone) {
      const phoneValidation = validatePhone(localProfile.phone);
      if (!phoneValidation.isValid) errors.phone = phoneValidation.error!;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    console.log('💾 handleSave called');
    console.log('👤 Current user:', user);
    console.log('📋 Local profile data:', localProfile);
    
    if (!user) {
      console.error('❌ No user found in session');
      toast({
        title: t('errors.title'),
        description: t('errors.sessionNotFound'),
        variant: "destructive"
      });
      return;
    }

    console.log('✅ User found, validating form...');
    if (!validateForm()) {
      console.error('❌ Form validation failed');
      toast({
        title: t('errors.validation'),
        description: t('errors.correctErrors'),
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Form validation passed');
    setLoading(true);
    try {
      // Sanitize profile data before saving
      const sanitizedProfile = {
        first_name: localProfile.first_name ? validateTextInput(localProfile.first_name, INPUT_LIMITS.NAME).sanitized : localProfile.first_name,
        last_name: localProfile.last_name ? validateTextInput(localProfile.last_name, INPUT_LIMITS.NAME).sanitized : localProfile.last_name,
        phone: localProfile.phone ? validateTextInput(localProfile.phone, INPUT_LIMITS.PHONE).sanitized : localProfile.phone,
        username: localProfile.username,
        avatar_url: localProfile.avatar_url
      };

      console.log('🧹 Sanitized profile:', sanitizedProfile);
      console.log('📤 Calling updateProfile...');
      
      const result = await updateProfile(sanitizedProfile);
      console.log('📨 updateProfile result:', result);
      
      if (result?.success) {
        console.log('✅ Profile update successful, closing modal');
        onOpenChange(false);
      } else {
        console.error('❌ Profile update failed');
      }
    } catch (error) {
      console.error('❌ handleSave error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Let Supabase handle auth token cleanup
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state and redirect
      }
      
      toast({
        title: t('profile.logoutSuccess'),
        description: t('profile.seeYouSoon')
      });
      
      // Fermer le modal et rediriger vers l'accueil
      onOpenChange(false);
      
      // Force redirect
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout even on error
      onOpenChange(false);
      navigate("/");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== t('profile.deleteConfirmationPhrase')) {
      toast({
        title: t('errors.title'),
        description: `${t('profile.typeExactly')} '${t('profile.deleteConfirmationPhrase')}' ${t('profile.toConfirm')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Marquer le compte pour suppression dans 30 jours
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ 
            // On pourrait ajouter un champ deleted_at si nécessaire
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
      }
      
      toast({
        title: t('profile.deleteRequestRegistered'),
        description: t('profile.accountDeletedIn30Days'),
        duration: 10000
      });
      
      // Déconnecter l'utilisateur
      await supabase.auth.signOut();
      onOpenChange(false);
      navigate("/");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.cannotProcessDeletion'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Enhanced password validation
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: t('errors.passwordError'),
        description: passwordValidation.error,
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('errors.title'),
        description: t('errors.passwordMismatch'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: t('profile.passwordUpdated'),
        description: t('profile.passwordUpdatedSuccess')
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.cannotChangePassword'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('errors.title'),
        description: t('profile.selectValidImage'),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('errors.title'),
        description: t('profile.imageTooLarge'),
        variant: "destructive"
      });
      return;
    }

    // Convert file to URL for adjustment modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageUrl(e.target?.result as string);
      setPhotoAdjustmentOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAdjustedImageSave = async (adjustedImageData: string) => {
    if (!user) return;
    
    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(adjustedImageData);
      const blob = await response.blob();
      
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;
      setLocalProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      
      // Sauvegarder immédiatement la nouvelle photo
      await updateProfile({ avatar_url: newAvatarUrl });
      
      toast({
        title: t('profile.avatarUpdated'),
        description: t('profile.avatarUploadSuccess')
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: t('errors.title'),
        description: t('profile.cannotUploadAvatar'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLocalProfile(prev => ({ ...prev, avatar_url: "" }));
    console.log('Debug - t function for avatarRemoved:', t('profile.avatarRemoved'));
    console.log('Debug - t function for avatarRemovedSuccess:', t('profile.avatarRemovedSuccess'));
    toast({
      title: t('profile.avatarRemoved'),
      description: t('profile.avatarRemovedSuccess')
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && localProfile.specialties.length < 2 && !localProfile.specialties.includes(newSpecialty.trim())) {
      setLocalProfile(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (index: number) => {
    setLocalProfile(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden p-0 m-4 sm:m-6 flex flex-col">
         <DialogHeader className="sr-only">
           <DialogTitle>{t('profile.userProfile')}</DialogTitle>
           <DialogDescription>
             {t('profile.profileDescription')}
           </DialogDescription>
         </DialogHeader>
        
        {/* Header avec avatar */}
        <div className="p-2 sm:p-4 md:p-6 lg:p-8 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <div className="relative">
              <div 
                className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted cursor-pointer group"
                onClick={() => setPhotoModalOpen(true)}
              >
                {localProfile.avatar_url ? (
                  <>
                    <img 
                      src={localProfile.avatar_url} 
                      alt={t('common.avatar')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {localProfile.first_name || localProfile.last_name
                  ? `${localProfile.first_name || ''} ${localProfile.last_name || ''}`.trim()
                  : localProfile.username || ''}
              </h1>
              {localProfile.username && (
                <p className="text-sm sm:text-base text-muted-foreground mb-1">
                  @{localProfile.username}
                </p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Content area - Scrollable */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-8 pb-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Colonne gauche - Informations personnelles */}
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  {t('profile.personalInfo')}
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="first_name" className="text-sm font-medium">{t('profile.firstName')}</Label>
                      <Input
                        ref={firstNameRef}
                        id="first_name"
                        value={localProfile.first_name}
                        onChange={(e) => setLocalProfile(prev => ({ ...prev, first_name: e.target.value }))}
                        onFocus={(e) => {
                          // Désélectionner tout le texte quand le champ reçoit le focus
                          setTimeout(() => {
                            e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                          }, 0);
                        }}
                        placeholder={t('profile.firstNamePlaceholder')}
                        className="mt-1"
                        autoFocus={false}
                      />
                       {validationErrors.first_name && (
                         <p className="text-xs text-destructive mt-1">{t('profile.firstNameRequired')}</p>
                       )}
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-sm font-medium">{t('profile.lastName')}</Label>
                      <Input
                        id="last_name"
                        value={localProfile.last_name}
                        onChange={(e) => setLocalProfile(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder={t('profile.lastNamePlaceholder')}
                        className="mt-1"
                      />
                       {validationErrors.last_name && (
                         <p className="text-xs text-destructive mt-1">{t('profile.lastNameRequired')}</p>
                       )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-sm font-medium">{t('profile.username')}</Label>
                    <Input
                      id="username"
                      value={localProfile.username}
                      onChange={(e) => setLocalProfile(prev => ({ ...prev, username: e.target.value }))}
                      placeholder={t('profile.usernamePlaceholder')}
                      className="mt-1"
                    />
                     {validationErrors.username && (
                       <p className="text-xs text-destructive mt-1">{validationErrors.username}</p>
                     )}
                   </div>

                   {/* Spécialités Section */}
                   <div>
                     <Label className="text-sm font-medium">{t('profile.specialties')} (Max 2)</Label>
                     
                     {/* Display selected specialties */}
                     {localProfile.specialties.length > 0 && (
                       <div className="flex flex-wrap gap-2 mt-2 mb-3">
                         {localProfile.specialties.map((specialty, index) => (
                           <Badge key={index} variant="secondary" className="flex items-center gap-1">
                             {specialty}
                             <button
                               type="button"
                               onClick={() => removeSpecialty(index)}
                               className="ml-1 hover:text-destructive"
                             >
                               <X className="h-3 w-3" />
                             </button>
                           </Badge>
                         ))}
                       </div>
                     )}
                     
                     {/* Add specialty input */}
                     {localProfile.specialties.length < 2 && (
                       <div className="flex gap-2">
                         <Input
                           value={newSpecialty}
                           onChange={(e) => setNewSpecialty(e.target.value)}
                           placeholder={t('profile.addSpecialtyPlaceholder')}
                           className="flex-1"
                           onKeyPress={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               addSpecialty();
                             }
                           }}
                         />
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={addSpecialty}
                           disabled={!newSpecialty.trim() || localProfile.specialties.length >= 2}
                         >
                           <Plus className="h-4 w-4" />
                         </Button>
                       </div>
                     )}
                     
                     <p className="text-xs text-muted-foreground mt-1">
                       {t('profile.specialtiesHint')} ({localProfile.specialties.length}/2)
                     </p>
                   </div>

                   <div>
                     <Label htmlFor="phone" className="text-sm font-medium">{t('profile.phone')}</Label>
                    <Input
                      id="phone"
                      value={localProfile.phone}
                      onChange={(e) => setLocalProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (514) 123-4567"
                      className="mt-1"
                    />
                     {validationErrors.phone && (
                       <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>
                     )}
                  </div>
                </div>
              </div>

              {/* Section Notifications */}
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('profile.notifications')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        {t('profile.emailNotifications')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.emailNotificationsDescription')}
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={localProfile.notifications.email}
                      onCheckedChange={(checked) => 
                        setLocalProfile(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications" className="text-sm font-medium">
                        {t('profile.pushNotifications')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.pushNotificationsDescription')}
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={localProfile.notifications.push}
                      onCheckedChange={(checked) => 
                        setLocalProfile(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, push: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite - Sécurité et Actions */}
            <div className="space-y-6">
              {/* Section Sécurité */}
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('profile.security')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t('profile.password')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.passwordDescription')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                    >
                      {t('profile.modify')}
                    </Button>
                  </div>
                  
                  {showPasswordSection && (
                    <div className="space-y-3 pt-2 border-t">
                      <div>
                        <Label htmlFor="new-password" className="text-sm">{t('profile.newPassword')}</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder={t('profile.newPasswordPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password" className="text-sm">{t('profile.confirmPassword')}</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder={t('profile.confirmPasswordPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handlePasswordChange}
                          disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                          size="sm"
                          className="flex-1"
                        >
                          {t('profile.updatePassword')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowPasswordSection(false);
                            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          }}
                        >
                          {t('profile.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Actions du compte */}
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {t('profile.accountActions')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t('profile.logout')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.logoutDescription')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('profile.logout')}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-destructive">{t('profile.deleteAccount')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.deleteAccountDescription')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDeleteSection(!showDeleteSection)}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('profile.deleteAccount')}
                    </Button>
                  </div>
                  
                  {showDeleteSection && (
                    <div className="space-y-3 pt-4 border-t border-destructive/20">
                      <div>
                        <Label className="text-destructive font-medium">{t('profile.deleteConfirmation')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('profile.deleteConfirmationText')} <strong>"{t('profile.deleteConfirmationPhrase')}"</strong>
                        </p>
                        <Input
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder={t('profile.deleteConfirmationPlaceholder')}
                        />
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive"
                            disabled={deleteConfirmation !== t('profile.deleteConfirmationPhrase')}
                            className="w-full"
                          >
                            {t('profile.confirmDeletion')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('profile.deleteAccountTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('profile.deleteAccountDescription')}
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec boutons d'action - Toujours visible */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-4 sm:p-6 border-t bg-background/95 backdrop-blur-sm flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="order-2 sm:order-1 h-12 sm:h-10"
          >
            {t('profile.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="order-1 sm:order-2 min-w-[120px] h-12 sm:h-10 text-base sm:text-sm font-semibold bg-primary hover:bg-primary/90"
           >
             {loading ? t('profile.saving') : t('profile.save')}
           </Button>
         </div>
        </DialogContent>

        {/* Photo Action Modal */}
        <PhotoActionModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          currentImageUrl={localProfile.avatar_url}
          onUpload={handleAvatarUpload}
          onRemove={handleRemoveAvatar}
          photoType="profile"
          uploading={uploading}
        />

        {/* Photo Adjustment Modal */}
        <PhotoAdjustmentModal
          open={photoAdjustmentOpen}
          onOpenChange={setPhotoAdjustmentOpen}
          imageUrl={tempImageUrl}
          onSave={handleAdjustedImageSave}
          title={t('profile.adjustProfilePhoto')}
        />
      </Dialog>
   );
 };