import React, { useState, useEffect } from 'react';
import RichTextRenderer from './RichTextRenderer';

interface TypewriterRichTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const TypewriterRichText: React.FC<TypewriterRichTextProps> = ({ 
  text, 
  speed = 30, 
  className = "",
  onComplete 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className={className}>
      <RichTextRenderer content={displayedText} />
      {currentIndex < text.length && (
        <span className="animate-pulse text-foreground">|</span>
      )}
    </div>
  );
};

export default TypewriterRichText;