import React, { useState, useEffect } from 'react';
import RichTextRenderer from './RichTextRenderer';

interface TypewriterRichTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  shouldStop?: boolean;
  onStopped?: (partialText: string) => void;
}

const TypewriterRichText: React.FC<TypewriterRichTextProps> = ({ 
  text, 
  speed = 30, 
  className = "",
  onComplete,
  shouldStop = false,
  onStopped
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStopped, setIsStopped] = useState(false);

  // Handle shouldStop prop
  useEffect(() => {
    if (shouldStop && !isStopped) {
      setIsStopped(true);
      if (onStopped) {
        onStopped(displayedText);
      }
    }
  }, [shouldStop, isStopped, displayedText, onStopped]);

  useEffect(() => {
    if (currentIndex < text.length && !isStopped && !shouldStop) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length && !isStopped && !shouldStop) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isStopped, shouldStop]);

  // Handle stop signal
  useEffect(() => {
    if (isStopped && onStopped) {
      onStopped(displayedText);
    }
  }, [isStopped, displayedText, onStopped]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsStopped(false);
  }, [text]);

  return (
    <div className={className}>
      <RichTextRenderer content={displayedText} />
    </div>
  );
};

export default TypewriterRichText;