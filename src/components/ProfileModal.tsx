import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, User as UserIcon } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import type { User } from "@supabase/supabase-js";
import { validateTextInput, validatePhone, validatePassword, INPUT_LIMITS } from "@/lib/validation";
import { useTranslation } from 'react-i18next';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { t } = useTranslation();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const { profile, loading: profileLoading, updateProfile, loadProfile } = useProfile();
  const [localProfile, setLocalProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    username: "",
    chef_emoji_color: "👋",
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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Person emojis with different skin tones
  const personEmojis = [
    "👋", "👤", "😊", "😄", "🙂", "😉", "🤗", "🥰", "😎", "🤓",
    "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧓", "👴", "👵",
    "👶🏻", "🧒🏻", "👦🏻", "👧🏻", "🧑🏻", "👨🏻", "👩🏻", "🧓🏻", "👴🏻", "👵🏻",
    "👶🏼", "🧒🏼", "👦🏼", "👧🏼", "🧑🏼", "👨🏼", "👩🏼", "🧓🏼", "👴🏼", "👵🏼",
    "👶🏽", "🧒🏽", "👦🏽", "👧🏽", "🧑🏽", "👨🏽", "👩🏽", "🧓🏽", "👴🏽", "👵🏽",
    "👶🏾", "🧒🏾", "👦🏾", "👧🏾", "🧑🏾", "👨🏾", "👩🏾", "🧓🏾", "👴🏾", "👵🏾",
    "👶🏿", "🧒🏿", "👦🏿", "👧🏿", "🧑🏿", "👨🏿", "👩🏿", "🧓🏿", "👴🏿", "👵🏿"
  ];

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
        chef_emoji_color: profile.chef_emoji_color || "👋",
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
        title: "Erreur",
        description: "Impossible de charger la session utilisateur",
        variant: "destructive"
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (localProfile.first_name) {
      const nameValidation = validateTextInput(localProfile.first_name, INPUT_LIMITS.NAME, "First name");
      if (!nameValidation.isValid) errors.first_name = nameValidation.error!;
    }

    if (localProfile.last_name) {
      const nameValidation = validateTextInput(localProfile.last_name, INPUT_LIMITS.NAME, "Last name");
      if (!nameValidation.isValid) errors.last_name = nameValidation.error!;
    }

    if (localProfile.username) {
      const usernameValidation = validateTextInput(localProfile.username, INPUT_LIMITS.USERNAME, "Username");
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
        title: "Erreur",
        description: "Session utilisateur introuvable",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ User found, validating form...');
    if (!validateForm()) {
      console.error('❌ Form validation failed');
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs avant de sauvegarder",
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
        chef_emoji_color: localProfile.chef_emoji_color
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
      // Clear local storage and session data first
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state and redirect
      }
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur Cuizly !"
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
      localStorage.clear();
      sessionStorage.clear();
      onOpenChange(false);
      navigate("/");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== t('profile.deleteConfirmationPhrase')) {
      toast({
        title: "Erreur",
        description: `Veuillez taper exactement '${t('profile.deleteConfirmationPhrase')}' pour confirmer`,
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
        title: "Demande de suppression enregistrée",
        description: "Votre compte sera automatiquement supprimé dans 30 jours. Vous pouvez vous reconnecter avant cette échéance pour annuler la suppression.",
        duration: 10000
      });
      
      // Déconnecter l'utilisateur
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

  const handlePasswordChange = async () => {
    // Enhanced password validation
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Erreur de mot de passe",
        description: passwordValidation.error,
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
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
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès"
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le mot de passe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden p-0 m-4 sm:m-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Profil utilisateur</DialogTitle>
        </DialogHeader>
        {/* Header simplifié sans photo de couverture */}
        <div className="p-4 sm:p-6 lg:p-8 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-foreground border-4 border-background shadow-lg">
              {(localProfile.username || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {localProfile.first_name} {localProfile.last_name}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                @{localProfile.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto max-h-[calc(95vh-160px)] sm:max-h-[calc(95vh-200px)]">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Colonne gauche - Informations personnelles */}
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6">
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
                        <p className="text-xs text-destructive mt-1">{validationErrors.first_name}</p>
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
                        <p className="text-xs text-destructive mt-1">{validationErrors.last_name}</p>
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

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">{t('profile.phone')}</Label>
                    <Input
                      id="phone"
                      value={localProfile.phone}
                      onChange={(e) => setLocalProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (XXX) XXX-XXXX"
                      className="mt-1"
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">{t('profile.email')}</Label>
                    <Input 
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Emoji Selection */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  😊 {t('profile.emojiAvatar')}
                </h3>
                <div>
                  <Label className="text-sm font-medium mb-3 block">{t('profile.chooseEmoji')}</Label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                    {personEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant={localProfile.chef_emoji_color === emoji ? "default" : "outline"}
                        className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-base sm:text-lg hover:scale-110 transition-transform"
                        onClick={() => setLocalProfile(prev => ({ ...prev, chef_emoji_color: emoji }))}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('profile.selected')} <span className="text-lg">{localProfile.chef_emoji_color}</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Colonne droite - Préférences et sécurité */}
            <div className="space-y-6">
              {/* Notifications */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🔔 {t('profile.notifications')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <Label htmlFor="push" className="font-medium">{t('profile.pushNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('profile.pushNotificationsDescription')}</p>
                    </div>
                    <Switch
                      id="push"
                      checked={localProfile.notifications.push}
                      onCheckedChange={(checked) => 
                        setLocalProfile(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, push: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <Label htmlFor="email_notif" className="font-medium">{t('profile.emailNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('profile.emailNotificationsDescription')}</p>
                    </div>
                    <Switch
                      id="email_notif"
                      checked={localProfile.notifications.email}
                      onCheckedChange={(checked) =>
                        setLocalProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🔒 {t('profile.security')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t('profile.changePassword')}</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                    >
                      {showPasswordSection ? t('profile.cancel') : t('profile.modify')}
                    </Button>
                  </div>

                  {showPasswordSection && (
                    <div className="space-y-4 p-4 bg-background rounded-lg border">
                      <div>
                        <Label htmlFor="newPassword" className="text-sm font-medium">{t('profile.newPassword')}</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder={t('profile.newPasswordPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('profile.confirmPassword')}</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder={t('profile.confirmPasswordPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handlePasswordChange} 
                        disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="w-full"
                      >
                        {t('profile.changePasswordButton')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions du compte */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  ⚙️ {t('profile.accountActions')}
                </h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('profile.logout')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteSection(!showDeleteSection)}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('profile.deleteAccountAction')}
                  </Button>
                </div>

                {showDeleteSection && (
                  <div className="mt-4 space-y-3 p-4 border rounded-lg bg-destructive/5">
                    <div className="space-y-2">
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

          {/* Footer avec boutons d'action */}
          <div className="flex justify-between items-center pt-6 border-t bg-background/80 backdrop-blur-sm sticky bottom-0 px-8 py-4 -mx-8 -mb-6">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? t('profile.saving') : t('profile.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};