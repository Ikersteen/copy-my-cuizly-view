import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface PhotoActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  photoType: 'profile' | 'cover';
  uploading: boolean;
}

export const PhotoActionModal = ({
  isOpen,
  onClose,
  currentImageUrl,
  onUpload,
  onRemove,
  photoType,
  uploading
}: PhotoActionModalProps) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  };

  const handleRemove = async () => {
    await onRemove();
    onClose();
  };

  const photoTitle = photoType === 'profile' ? 'Photo de profil' : 'Photo de couverture';
  const aspectRatio = photoType === 'profile' ? 'aspect-square' : 'aspect-video';
  const imageSize = photoType === 'profile' ? 'w-48 h-48' : 'w-80 h-48';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-sm p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{photoTitle}</DialogTitle>
          <DialogDescription>
            {photoType === 'profile' ? 'Gérer votre photo de profil' : 'Gérer votre photo de couverture'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Header */}
        <div className="relative bg-black/80 text-white p-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute left-4 top-4 text-white hover:bg-white/10 p-1"
          >
            <X className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-medium">{photoTitle}</h3>
        </div>

        {/* Photo Preview */}
        <div className="flex justify-center p-6 bg-muted/50">
          <div className={`${imageSize} rounded-full border-4 border-background shadow-lg overflow-hidden bg-muted ${photoType === 'cover' ? 'rounded-lg' : ''}`}>
            {currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                alt={photoTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 space-y-2">
          {/* Upload/Modify Button */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photo-upload"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mr-3" />
              ) : (
                <Upload className="h-5 w-5 mr-3" />
              )}
              {uploading ? 'Téléchargement...' : (currentImageUrl ? 'Modifier la photo' : 'Ajouter une photo')}
            </Button>
          </div>

          {/* Remove Button - Only show if there's an existing image */}
          {currentImageUrl && (
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Trash2 className="h-5 w-5 mr-3" />
              Supprimer la photo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};