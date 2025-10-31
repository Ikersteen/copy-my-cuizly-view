import React from 'react';

interface VoiceActivationOrbProps {
  state: 'idle' | 'listening' | 'speaking';
  onClick?: () => void;
}

const VoiceActivationOrb: React.FC<VoiceActivationOrbProps> = ({ state, onClick }) => {
  const getOrbSize = () => {
    switch (state) {
      case 'idle': return 'w-16 h-16';
      case 'listening': return 'w-24 h-24';
      case 'speaking': return 'w-20 h-20';
      default: return 'w-16 h-16';
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
    <div className="fixed bottom-8 right-8 z-50">
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
            ? '0 10px 30px -10px hsl(var(--primary) / 0.5)'
            : '0 20px 60px -10px rgba(0, 245, 255, 0.6)'
        }}
        onClick={onClick}
      >
        <div className="w-full h-full rounded-full backdrop-blur-sm" />
      </div>
      
      {state !== 'idle' && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none orb-glow"
          style={{
            background: 'radial-gradient(circle, rgba(0,245,255,0.2) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
};

export default VoiceActivationOrb;