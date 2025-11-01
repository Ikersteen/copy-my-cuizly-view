import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EyeOff, XCircle } from "lucide-react";

interface VoiceActivationOrbProps {
  state: 'idle' | 'listening' | 'speaking';
  onClick?: () => void;
  onHideForOneHour?: () => void;
  onDisable?: () => void;
}

const VoiceActivationOrb: React.FC<VoiceActivationOrbProps> = ({ state, onClick, onHideForOneHour, onDisable }) => {
  const getOrbSize = () => {
    switch (state) {
      case 'idle': return 'w-12 h-12';
      case 'listening': return 'w-16 h-16';
      case 'speaking': return 'w-14 h-14';
      default: return 'w-12 h-12';
    }
  };

  const getOrbAnimation = () => {
    switch (state) {
      case 'idle': return 'orb-pulse';
      case 'listening': return 'orb-rotate';
      case 'speaking': return 'orb-speak';
      default: return '';
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`${getOrbSize()} rounded-full cursor-pointer transition-all duration-300 ${getOrbAnimation()}`}
            style={{
              background: state === 'idle' 
                ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                : state === 'listening'
                ? 'linear-gradient(135deg, #00F5FF, #FF00E5, #FFAA00, #00FF85)'
                : 'linear-gradient(135deg, #FF00E5, #00F5FF, #00FF85, #FFAA00)',
              backgroundSize: '400% 400%',
              animation: state !== 'idle' ? `gradient-flow 3s ease infinite, ${getOrbAnimation()} ${state === 'speaking' ? '0.6s' : '3s'} ease infinite` : `${getOrbAnimation()} 2s ease-in-out infinite`,
              boxShadow: state === 'idle' 
                ? '0 8px 24px -8px hsl(var(--primary) / 0.5)'
                : '0 12px 40px -8px rgba(0, 245, 255, 0.6)'
            }}
            onClick={onClick}
          >
            <div className="w-full h-full rounded-full backdrop-blur-sm" />
          </div>
          
          {state !== 'idle' && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none orb-glow"
              style={{
                background: 'radial-gradient(circle, rgba(0,245,255,0.2) 0%, transparent 70%)',
              }}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-background border-border">
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onHideForOneHour?.();
          }}
          className="cursor-pointer"
        >
          <EyeOff className="mr-2 h-4 w-4" />
          <span>Cacher pendant 1 heure</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDisable?.();
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          <span>Désactiver Cuizly</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default VoiceActivationOrb;