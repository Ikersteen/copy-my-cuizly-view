import { useState } from 'react';
import { Cloud, Download, RefreshCw, FileText, Folder, Image, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import LoadingSpinner from './LoadingSpinner';

export const GoogleDriveManager = () => {
  const { isConnected, files, loading, connectDrive, listFiles, syncFile, disconnectDrive } = useGoogleDrive();
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (fileId: string, fileName: string) => {
    setSyncing(fileId);
    await syncFile(fileId, fileName);
    setSyncing(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="h-5 w-5 text-yellow-500" />;
    if (mimeType.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive
          </CardTitle>
          <CardDescription>
            Connectez votre compte Google Drive pour synchroniser vos fichiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectDrive} className="w-full">
            <Cloud className="mr-2 h-4 w-4" />
            Connecter Google Drive
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-green-500" />
              Google Drive
            </CardTitle>
            <CardDescription>Gérez vos fichiers synchronisés</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => listFiles()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={disconnectDrive}>
              Déconnecter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun fichier trouvé</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => listFiles()}>
              Actualiser
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.modifiedTime).toLocaleDateString('fr-FR')}
                        {file.size && ` • ${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(file.id, file.name)}
                    disabled={syncing === file.id}
                  >
                    {syncing === file.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
