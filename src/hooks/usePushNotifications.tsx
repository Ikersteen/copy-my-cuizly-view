import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Non supporté',
        description: 'Les notifications ne sont pas supportées sur ce navigateur',
        variant: 'destructive'
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez désormais des notifications en temps réel'
      });
      return true;
    }

    return false;
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let pushSubscription = await registration.pushManager.getSubscription();
      
      if (!pushSubscription) {
      // Subscribe to push notifications
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          });
        }
      }

      setSubscription(pushSubscription);

      // Save subscription to localStorage for now
      const { data: { user } } = await supabase.auth.getUser();
      if (user && pushSubscription) {
        localStorage.setItem(
          `push_subscription_${user.id}`,
          JSON.stringify(pushSubscription.toJSON())
        );
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.removeItem(`push_subscription_${user.id}`);
      }

      toast({
        title: 'Notifications désactivées',
        description: 'Vous ne recevrez plus de notifications push'
      });
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}
