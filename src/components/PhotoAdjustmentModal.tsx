import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, ZoomOut, Move } from "lucide-react";

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
  title = "Ajuster la photo" 
}: PhotoAdjustmentModalProps) => {
  const [scale, setScale] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
  };

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale[0] / 100, scale[0] / 100);
    ctx.translate(-canvas.width / 2 + position.x, -canvas.height / 2 + position.y);
    
    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Get the adjusted image data
    const adjustedImageData = canvas.toDataURL('image/jpeg', 0.9);
    onSave(adjustedImageData);
    onOpenChange(false);
    resetAdjustments();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
                alt="Aperçu"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale[0] / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <ZoomOut className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm mb-2">Zoom: {scale[0]}%</p>
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
                <p className="text-sm mb-2">Rotation: {rotation}°</p>
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
              <span>Cliquez et faites glisser l'image pour la repositionner</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetAdjustments}>
              Réinitialiser
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                Appliquer
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