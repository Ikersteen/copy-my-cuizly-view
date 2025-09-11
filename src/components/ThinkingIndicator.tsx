import React from 'react';

interface ThinkingIndicatorProps {
  className?: string;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default ThinkingIndicator;