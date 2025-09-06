import React, { useEffect, useRef } from 'react';

interface VoiceWaveAnimationProps {
  isActive: boolean;
  audioLevel?: number;
  className?: string;
}

const VoiceWaveAnimation: React.FC<VoiceWaveAnimationProps> = ({ 
  isActive, 
  audioLevel = 0, 
  className = "" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const wavePoints = useRef<number[]>(new Array(50).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerY = canvas.height / 2;
      const baseAmplitude = isActive ? 20 : 5;
      const amplitude = baseAmplitude * (1 + audioLevel * 2);
      
      // Update wave points
      for (let i = 0; i < wavePoints.current.length; i++) {
        if (isActive) {
          wavePoints.current[i] = Math.sin(Date.now() * 0.01 + i * 0.3) * amplitude;
        } else {
          wavePoints.current[i] *= 0.95; // Fade out when inactive
        }
      }

      // Draw multiple wave layers
      const colors = [
        'rgba(147, 51, 234, 0.8)', // Primary purple
        'rgba(147, 51, 234, 0.5)',
        'rgba(147, 51, 234, 0.3)'
      ];

      colors.forEach((color, layerIndex) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 - layerIndex;
        ctx.beginPath();

        for (let i = 0; i < wavePoints.current.length; i++) {
          const x = (i / (wavePoints.current.length - 1)) * canvas.width;
          const offset = Math.sin(Date.now() * 0.005 + layerIndex * 0.5) * 10;
          const y = centerY + wavePoints.current[i] + offset;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioLevel]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full h-full"
      />
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" />
      )}
    </div>
  );
};

export default VoiceWaveAnimation;