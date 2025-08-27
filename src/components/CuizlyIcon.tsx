import React from 'react';

interface CuizlyIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CuizlyIcon: React.FC<CuizlyIconProps> = ({ className = "h-6 w-6", style }) => {
  return (
    <img 
      src="/lovable-uploads/e8fe9351-fe46-440d-914c-b9b28918fe73.png" 
      alt="Cuizly" 
      className={className}
      style={{
        filter: 'opacity(0.6)',  // Fondu léger
        ...style
      }}
      loading="lazy"
    />
  );
};