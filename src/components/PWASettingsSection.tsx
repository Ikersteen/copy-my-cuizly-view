import { useState } from 'react';
import { Bell, Download, Smartphone, Cloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { GoogleDriveManager } from './GoogleDriveManager';

export const PWASettingsSection = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(permission === 'granted');

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Application Progressive (PWA)
          </CardTitle>
          <CardDescription>
            Installez Cuizly Manager comme application native
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Application installée</p>
                <p className="text-sm text-muted-foreground">
                  Cuizly Manager est installé sur votre appareil
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Download className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Installation disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Installez l'app pour un accès rapide et hors ligne
                  </p>
                </div>
              </div>
              <Button onClick={promptInstall} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Installer l'application
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">
                {isInstalled 
                  ? "L'application est déjà installée"
                  : "Installation non disponible sur ce navigateur"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Push
          </CardTitle>
          <CardDescription>
            Recevez des alertes en temps réel pour vos réservations et messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSupported ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications" className="text-base">
                    Activer les notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Restez informé des nouvelles réservations et messages
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              
              {notificationsEnabled && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-foreground">
                    ✓ Notifications activées - Vous recevrez des alertes en temps réel
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">
                Les notifications push ne sont pas supportées sur ce navigateur
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Drive Integration */}
      <GoogleDriveManager />

      {/* Offline Mode Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Mode Hors Ligne
          </CardTitle>
          <CardDescription>
            L'application fonctionne même sans connexion internet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium text-sm text-foreground">Cache automatique</p>
                <p className="text-sm text-muted-foreground">
                  Les données sont mises en cache automatiquement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium text-sm text-foreground">Synchronisation auto</p>
                <p className="text-sm text-muted-foreground">
                  Les modifications sont synchronisées dès la reconnexion
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium text-sm text-foreground">Accès hors ligne</p>
                <p className="text-sm text-muted-foreground">
                  Consultez vos données même sans internet
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
