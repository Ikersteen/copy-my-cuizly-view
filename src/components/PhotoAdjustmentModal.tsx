import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, ZoomOut, Move } from "lucide-react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
  };

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) {
      console.error('Canvas, image, or image not loaded');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match the image natural dimensions or reasonable size
    const img = imageRef.current;
    const maxWidth = 1200; // Increased from 800
    const maxHeight = 900;  // Increased from 600
    
    let { naturalWidth: width, naturalHeight: height } = img;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }
    
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale[0] / 100, scale[0] / 100);
    ctx.translate(-canvas.width / 2 + position.x, -canvas.height / 2 + position.y);
    
    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
    onSave(adjustedImageData);
    onOpenChange(false);
    resetAdjustments();
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
                className="absolute inset-0 w-full h-full object-cover"
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

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetAdjustments}>
              {t('photoAdjustment.reset')}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('photoAdjustment.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={!imageLoaded}>
                {t('photoAdjustment.apply')}
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};