import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ConsumerProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConsumerProfileModal = ({ open, onOpenChange }: ConsumerProfileModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: ""
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: (profile as Profile).first_name || "",
        last_name: (profile as Profile).last_name || "",
        phone: (profile as Profile).phone || "",
        avatar_url: (profile as Profile).avatar_url || ""
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: t('profile.avatarUploadSuccess'),
        description: t('profile.avatarUploadSuccessDesc'),
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: t('profile.avatarUploadError'),
        description: t('profile.avatarUploadErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      onOpenChange(false);
      
      toast({
        title: t('profile.updateSuccess'),
        description: t('profile.updateSuccessDesc'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profile.updateError'),
        description: t('profile.updateErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const firstName = formData.first_name || '';
    const lastName = formData.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formData.avatar_url} alt="Profile" />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center space-y-2">
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingAvatar ? t('profile.uploading') : t('profile.changeAvatar')}</span>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('profile.firstName')}</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder={t('profile.firstNamePlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('profile.lastName')}</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder={t('profile.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('profile.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('profile.phonePlaceholder')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};