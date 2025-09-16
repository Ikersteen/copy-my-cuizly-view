import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Keyboard } from "lucide-react";

interface VoiceChatInterfaceProps {
  onClose?: () => void;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ onClose }) => {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
  };

  if (isStarted) {
    // Temporary placeholder for when conversation is started
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Conversation en cours...</h2>
          <Button onClick={() => setIsStarted(false)}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/64c3c5b4-0bea-428d-8a44-3f25301da946.png" 
            alt="Cuizly Logo"
            className="h-12 w-auto block dark:hidden"
          />
          <img 
            src="/lovable-uploads/0f8fb1c9-af76-4fbc-8cec-9dc5fd10dc99.png" 
            alt="Cuizly Logo"
            className="h-12 w-auto hidden dark:block brightness-125"
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            cuizly <span className="text-blue-600">Assistant Vocal</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Découvrez les meilleurs restaurants près de vous grâce à votre assistant vocal intelligent
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-muted rounded-full p-1 max-w-xs">
            <Button
              variant={inputMode === 'voice' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setInputMode('voice')}
              className="rounded-full px-4 py-2 flex-1"
            >
              <Mic className="w-4 h-4 mr-2" />
              Vocal
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setInputMode('text')}
              className="rounded-full px-4 py-2 flex-1"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Texte
            </Button>
          </div>
        </div>

        {/* Start Button */}
        <div className="py-8">
          <Button
            onClick={handleStart}
            className="w-24 h-24 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            size="lg"
          >
            {inputMode === 'voice' ? (
              <Mic className="w-8 h-8" />
            ) : (
              <Keyboard className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
          <p>
            {inputMode === 'voice' 
              ? "Cliquez sur le bouton bleu et parlez pour commencer votre recherche" 
              : "Cliquez sur le bouton bleu pour commencer à écrire votre recherche"
            }
          </p>
          <p>
            L'assistant vous aidera à trouver des restaurants selon vos préférences
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className="text-xs text-muted-foreground">
            Cuizly peut parfois se tromper, pensez à vérifier les infos importantes.
          </p>
        </div>

      </div>
    </div>
  );
};

export default VoiceChatInterface;