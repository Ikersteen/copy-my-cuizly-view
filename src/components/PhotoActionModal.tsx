import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload, X, Image, Edit3 } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
      handleCancel();
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const handleRemove = async () => {
    await onRemove();
    handleCancel();
  };

  const photoTitle = photoType === 'profile' ? t('photos.profilePhoto') : t('photos.coverPhoto');
  const aspectRatio = photoType === 'profile' ? 'aspect-square' : 'aspect-video';
  const imageSize = photoType === 'profile' ? 'w-48 h-48' : 'w-80 h-48';

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-sm bg-background border-0 shadow-2xl p-0 overflow-hidden rounded-3xl">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{photoTitle}</DialogTitle>
            <DialogDescription>
              {photoType === 'profile' ? 'Gérer votre photo de profil' : 'Gérer votre photo de couverture'}
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        
        {/* Header avec gradient moderne */}
        <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              {photoType === 'profile' ? (
                <Camera className="h-5 w-5" />
              ) : (
                <Image className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{photoTitle}</h3>
              <p className="text-white/80 text-sm">
                {photoType === 'profile' ? 'Personnalisez votre profil' : 'Ajoutez une image d\'en-tête'}
              </p>
            </div>
          </div>
        </div>

        {/* Photo Preview avec design moderne */}
        <div className="flex justify-center p-8 bg-gradient-to-br from-muted/50 to-background">
          <div className="relative">
            <div className={`${imageSize} border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 ${photoType === 'cover' ? 'rounded-2xl' : 'rounded-full'}`}>
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt={photoTitle}
                  className="w-full h-full object-cover"
                />
              ) : currentImageUrl ? (
                <img 
                  src={currentImageUrl} 
                  alt={photoTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="p-4 rounded-full bg-primary/10 mb-3">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{t('emptyStates.noPhoto')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons avec design moderne */}
        <div className="p-6 space-y-3 bg-background">
          {selectedFile ? (
            // Show save/cancel buttons when file is selected
            <>
              <Button
                className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleSave}
                disabled={uploading}
              >
                <div className="flex items-center justify-center gap-3">
                  {uploading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                      <span>{t('actions.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>{t('actions.save')}</span>
                    </>
                  )}
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium rounded-xl transition-all duration-200"
                onClick={handleCancel}
                disabled={uploading}
              >
                {t('actions.cancel')}
              </Button>
            </>
          ) : (
            // Show upload/modify button when no file selected
            <>
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
                  className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploading}
                >
                  <div className="flex items-center justify-center gap-3">
                    {currentImageUrl ? (
                      <Edit3 className="h-5 w-5" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    <span>{currentImageUrl ? t('photos.modifyPhoto') : t('photos.choosePhoto')}</span>
                  </div>
                </Button>
              </div>

              {/* Remove Button - Only show if there's an existing image */}
              {currentImageUrl && (
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40 rounded-xl transition-all duration-200"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  {t('photos.deletePhoto')}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};