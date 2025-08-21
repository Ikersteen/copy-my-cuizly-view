import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const [profile, setProfile] = useState({
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
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      console.log('Loading profile...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        return;
      }

      setUser(session.user);
      console.log('User session:', session.user.id);

      // Charger le profil depuis la base de données
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      console.log('Profile data from DB:', data);
      console.log('Profile error:', error);

      if (data) {
        // Si le profil existe, utiliser les données de la DB
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          username: data.username || "",
          notifications: {
            push: true,
            email: true
          }
        });
      } else {
        // Si pas de profil en DB, créer avec les données de l'auth
        const newProfile = {
          user_id: session.user.id,
          first_name: session.user.user_metadata?.first_name || "",
          last_name: session.user.user_metadata?.last_name || "",
          phone: session.user.phone || "",
          username: ""
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          console.log('Created new profile:', createdProfile);
          setProfile({
            first_name: createdProfile.first_name || "",
            last_name: createdProfile.last_name || "",
            phone: createdProfile.phone || "",
            username: createdProfile.username || "",
            notifications: {
              push: true,
              email: true
            }
          });
        }
      }
      console.log('Profile loaded successfully');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      console.log('No user found, cannot save profile');
      toast({
        title: "Erreur",
        description: "Session utilisateur introuvable",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Saving profile with data:', profile);
    console.log('User ID:', user.id);
    setLoading(true);
    
    try {
      const updateData = {
        user_id: user.id,
        first_name: profile.first_name || user.user_metadata?.first_name || "",
        last_name: profile.last_name || user.user_metadata?.last_name || "",
        phone: profile.phone || user.phone || "",
        username: profile.username
      };
      
      console.log('Update data being sent:', updateData);
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(updateData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      console.log('Upsert result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);
      
      // Mettre à jour l'état local avec les données sauvegardées
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        username: data.username || "",
        notifications: profile.notifications
      });
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
      
      // Fermer le modal après la sauvegarde réussie
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder le profil: ${error.message}`,
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
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
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
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
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
                checked={profile.notifications.push}
                onCheckedChange={(checked) => 
                  setProfile(prev => ({ 
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
                checked={profile.notifications.email}
                onCheckedChange={(checked) => 
                  setProfile(prev => ({ 
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
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};