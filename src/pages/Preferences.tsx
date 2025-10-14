import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ArrowLeft, X } from "lucide-react";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { CUISINE_OPTIONS, CUISINE_TRANSLATIONS } from "@/constants/cuisineTypes";

export default function Preferences() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dashboardRoute = useLocalizedRoute('/dashboard');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    cuisinePreferences: [] as string[],
    dietaryRestrictions: [] as string[],
    priceRange: "",
    notifications: {
      email: false,
      sms: false,
      push: false,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const notifPrefs = data.notification_preferences as any;
        setPreferences({
          cuisinePreferences: data.cuisine_preferences || [],
          dietaryRestrictions: data.dietary_restrictions || [],
          priceRange: data.price_range || "",
          notifications: {
            email: notifPrefs?.email || false,
            sms: notifPrefs?.sms || false,
            push: notifPrefs?.push || false,
          },
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          cuisine_preferences: preferences.cuisinePreferences,
          dietary_restrictions: preferences.dietaryRestrictions,
          price_range: preferences.priceRange,
          notification_preferences: preferences.notifications,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: t('preferences.saved'),
        description: t('preferences.savedSuccessfully'),
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.savingPreferences'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(dashboardRoute)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('navigation.back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('dashboard.preferences')}</CardTitle>
            <CardDescription>{t('preferences.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cuisine Preferences */}
            <div className="space-y-3">
              <Label className="text-base">{t('preferences.cuisineTypes')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CUISINE_OPTIONS.map((cuisine) => {
                  const isSelected = preferences.cuisinePreferences.includes(cuisine);
                  return (
                    <Button
                      key={cuisine}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCuisine(cuisine)}
                      className="justify-start"
                    >
                      {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                    </Button>
                  );
                })}
              </div>
              {preferences.cuisinePreferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {preferences.cuisinePreferences.map((cuisine) => (
                    <Badge key={cuisine} variant="secondary">
                      {CUISINE_TRANSLATIONS[cuisine as keyof typeof CUISINE_TRANSLATIONS]?.[i18n.language as 'fr' | 'en'] || cuisine}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => toggleCuisine(cuisine)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>{t('preferences.priceRange')}</Label>
              <Select
                value={preferences.priceRange}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, priceRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('preferences.selectPriceRange')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - {t('preferences.budget')}</SelectItem>
                  <SelectItem value="$$">$$ - {t('preferences.moderate')}</SelectItem>
                  <SelectItem value="$$$">$$$ - {t('preferences.expensive')}</SelectItem>
                  <SelectItem value="$$$$">$$$$ - {t('preferences.luxury')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <Label className="text-base">{t('preferences.notifications')}</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notif">{t('preferences.emailNotifications')}</Label>
                  <Switch
                    id="email-notif"
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: checked }
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notif">{t('preferences.smsNotifications')}</Label>
                  <Switch
                    id="sms-notif"
                    checked={preferences.notifications.sms}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, sms: checked }
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notif">{t('preferences.pushNotifications')}</Label>
                  <Switch
                    id="push-notif"
                    checked={preferences.notifications.push}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t('preferences.saving') : t('preferences.saveChanges')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
