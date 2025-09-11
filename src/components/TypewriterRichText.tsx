import React, { useState, useEffect } from 'react';
import RichTextRenderer from './RichTextRenderer';

interface TypewriterRichTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  onStop?: (partialText: string) => void;
}

const TypewriterRichText: React.FC<TypewriterRichTextProps> = ({ 
  text, 
  speed = 30, 
  className = "",
  onComplete,
  onStop 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length && !isStopped) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length && !isStopped) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isStopped]);

  // Handle stop signal
  useEffect(() => {
    if (isStopped && onStop) {
      onStop(displayedText);
    }
  }, [isStopped, displayedText, onStop]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsStopped(false);
  }, [text]);

  // Add stop method to component
  React.useEffect(() => {
    if (onStop) {
      (window as any).stopTypewriter = () => setIsStopped(true);
    }
    return () => {
      delete (window as any).stopTypewriter;
    };
  }, [onStop]);

  return (
    <div className={className}>
      <RichTextRenderer content={displayedText} />
    </div>
  );
};

export default TypewriterRichText;