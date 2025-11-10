import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export const useGoogleDrive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check localStorage for connection status
      const connected = localStorage.getItem(`google_drive_connected_${user.id}`);
      if (connected === 'true') {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking Drive connection:', error);
    }
  };

  const connectDrive = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive'
        });
        return;
      }

      // Redirect to Google OAuth
      const redirectUrl = `${window.location.origin}/restaurant-dashboard`;
      const scope = 'https://www.googleapis.com/auth/drive.readonly';
      const clientId = process.env.VITE_GOOGLE_DRIVE_CLIENT_ID;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUrl}&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `access_type=offline&` +
        `state=${user.id}&` +
        `prompt=consent`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Drive:', error);
      toast({
        title: 'Erreur de connexion',
        description: 'Impossible de se connecter à Google Drive',
        variant: 'destructive'
      });
    }
  };

  const listFiles = async (folderId?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('google-drive-list', {
        body: { folderId }
      });

      if (error) throw error;

      setFiles(data.files || []);
    } catch (error) {
      console.error('Error listing files:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les fichiers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-download', {
        body: { fileId }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier',
        variant: 'destructive'
      });
    }
  };

  const syncFile = async (fileId: string, fileName: string) => {
    try {
      const fileData = await downloadFile(fileId);
      if (!fileData) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to Supabase storage
      const { data, error } = await supabase.storage
        .from('restaurant-files')
        .upload(`${user.id}/${fileName}`, fileData.content, {
          contentType: fileData.mimeType,
          upsert: true
        });

      if (error) throw error;

      toast({
        title: 'Fichier synchronisé',
        description: `${fileName} a été importé dans Cuizly`
      });

      return data;
    } catch (error) {
      console.error('Error syncing file:', error);
      toast({
        title: 'Erreur de synchronisation',
        description: 'Impossible de synchroniser le fichier',
        variant: 'destructive'
      });
    }
  };

  const disconnectDrive = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      localStorage.removeItem(`google_drive_connected_${user.id}`);
      localStorage.removeItem(`google_drive_token_${user.id}`);

      setIsConnected(false);
      setFiles([]);

      toast({
        title: 'Déconnecté',
        description: 'Google Drive a été déconnecté'
      });
    } catch (error) {
      console.error('Error disconnecting Drive:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de se déconnecter',
        variant: 'destructive'
      });
    }
  };

  return {
    isConnected,
    files,
    loading,
    connectDrive,
    listFiles,
    downloadFile,
    syncFile,
    disconnectDrive
  };
};
