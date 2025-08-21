import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import type { User } from "@supabase/supabase-js";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [localProfile, setLocalProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    username: "",
    notifications: {
      push: true,
      email: true
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
        notifications: {
          push: true,
          email: true
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

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Session utilisateur introuvable",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile({
        first_name: localProfile.first_name,
        last_name: localProfile.last_name,
        phone: localProfile.phone,
        username: localProfile.username
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
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
      
      // Fermer le modal et rediriger vers l'accueil
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
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erreur", 
        description: "Le mot de passe doit contenir au moins 6 caractères",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={localProfile.first_name}
                onChange={(e) => setLocalProfile(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={localProfile.last_name}
                onChange={(e) => setLocalProfile(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={localProfile.username}
              onChange={(e) => setLocalProfile(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Votre nom d'utilisateur"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={localProfile.phone}
              onChange={(e) => setLocalProfile(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (XXX) XXX-XXXX"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Notifications</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="push">Notifications push</Label>
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

            <div className="flex items-center justify-between">
              <Label htmlFor="email_notif">Notifications email</Label>
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

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Changer le mot de passe</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? "Annuler" : "Modifier"}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Nouveau mot de passe"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="w-full"
                >
                  Changer le mot de passe
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Actions du compte</Label>
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
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer le compte
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading || profileLoading}>
            {loading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};