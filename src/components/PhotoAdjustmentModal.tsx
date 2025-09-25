import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, ZoomOut, Move, Save } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface PhotoAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (adjustedImageData: string) => void;
  title?: string;
}

export const PhotoAdjustmentModal = ({ 
  open, 
  onOpenChange, 
  imageUrl, 
  onSave, 
  title
}: PhotoAdjustmentModalProps) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetAdjustments = () => {
    setScale([100]);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
    setHasChanges(false);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };

  const handleSave = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) {
      console.error('Canvas, image, or image not loaded');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    
    // Calculate the dimensions needed to fit the transformed image
    const scaleRatio = scale[0] / 100;
    const rotationRad = (rotation * Math.PI) / 180;
    
    // Calculate bounding box for rotated image
    const cos = Math.abs(Math.cos(rotationRad));
    const sin = Math.abs(Math.sin(rotationRad));
    const rotatedWidth = (originalWidth * cos + originalHeight * sin) * scaleRatio;
    const rotatedHeight = (originalWidth * sin + originalHeight * cos) * scaleRatio;
    
    // Set canvas size to accommodate the full transformed image
    canvas.width = Math.ceil(rotatedWidth);
    canvas.height = Math.ceil(rotatedHeight);

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate position scaling from preview to final canvas
    const previewContainer = 300; // preview height
    const previewScale = previewContainer / Math.max(originalWidth, originalHeight);
    const finalPositionX = position.x / previewScale;
    const finalPositionY = position.y / previewScale;

    // Apply transformations
    ctx.save();
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply user transformations
    ctx.rotate(rotationRad);
    ctx.scale(scaleRatio, scaleRatio);
    ctx.translate(finalPositionX, finalPositionY);
    
    // Draw image centered
    ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
    
    ctx.restore();

    // Detect if image has transparency or if original was PNG
    const isTransparent = imageUrl.toLowerCase().includes('data:image/png') || 
                         imageUrl.toLowerCase().includes('.png');
    
    console.log('🖼️ Image type detected:', isTransparent ? 'PNG (transparent)' : 'JPEG');
    
    // Get the adjusted image data with appropriate format
    const adjustedImageData = isTransparent 
      ? canvas.toDataURL('image/png') // Keep PNG for transparency
      : canvas.toDataURL('image/jpeg', 0.95); // Higher quality JPEG
      
    console.log('💾 Generated image data length:', adjustedImageData.length);
    setIsAutoSaving(true);
    onSave(adjustedImageData);
    setTimeout(() => {
      setIsAutoSaving(false);
      setHasChanges(false);
      onOpenChange(false);
      resetAdjustments();
    }, 500);
  }, [scale, rotation, position, imageLoaded, imageUrl, onSave, onOpenChange]);

  // Auto-save when adjustments change
  const triggerAutoSave = useCallback(() => {
    setHasChanges(true);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (imageLoaded) {
        handleSave();
      }
    }, 1500); // Auto-save after 1.5 seconds of inactivity
  }, [handleSave, imageLoaded]);

  // Track changes in adjustments
  useEffect(() => {
    if (imageLoaded && (scale[0] !== 100 || rotation !== 0 || position.x !== 0 || position.y !== 0)) {
      triggerAutoSave();
    }
  }, [scale, rotation, position, imageLoaded, triggerAutoSave]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleManualSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    handleSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl z-[60]">
        <DialogHeader>
          <DialogTitle>{title || t('photoAdjustment.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div className="relative bg-muted rounded-lg overflow-hidden" style={{ height: '300px' }}>
            <div 
              className="absolute inset-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={t('photoAdjustment.preview')}
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale[0] / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                  setImageLoaded(true);
                }}
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  setImageLoaded(false);
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <ZoomOut className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm mb-2">{t('photoAdjustment.zoom')}: {scale[0]}%</p>
                <Slider
                  value={scale}
                  onValueChange={setScale}
                  min={50}
                  max={200}
                  step={10}
                  className="w-full"
                />
              </div>
              <ZoomIn className="h-4 w-4" />
            </div>

            <div className="flex items-center space-x-4">
              <RotateCw className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm mb-2">{t('photoAdjustment.rotation')}: {rotation}°</p>
                <Slider
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                  min={-180}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Move className="h-4 w-4" />
              <span>{t('photoAdjustment.dragInstruction')}</span>
            </div>
          </div>

          {/* Auto-save Status & Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isAutoSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>{t('photoAdjustment.autoSaving')}</span>
                </>
              ) : hasChanges ? (
                <>
                  <Save className="h-4 w-4 text-primary" />
                  <span>{t('photoAdjustment.willAutoSave')}</span>
                </>
              ) : (
                <span>{t('photoAdjustment.ready')}</span>
              )}
            </div>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={resetAdjustments}>
                {t('photoAdjustment.reset')}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('photoAdjustment.close')}
              </Button>
              {hasChanges && (
                <Button onClick={handleManualSave} disabled={!imageLoaded || isAutoSaving}>
                  {t('photoAdjustment.saveNow')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};