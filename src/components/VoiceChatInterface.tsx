import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Keyboard } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface VoiceChatInterfaceProps {
  onClose?: () => void;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          cuizly <span className="text-cuizly-assistant">Assistant Vocal</span>
        </h1>
        <p className="text-lg text-cuizly-neutral max-w-2xl mx-auto">
          Parlez naturellement pour trouver des restaurants, consulter vos préférences ou découvrir de nouvelles saveurs.
        </p>
      </div>

      {/* Mode Toggle Buttons */}
      <div className="flex bg-muted rounded-full p-1 shadow-sm">
        <Button
          variant={inputMode === 'voice' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setInputMode('voice')}
          className="rounded-full px-6 py-2"
        >
          <Mic className="w-4 h-4 mr-2" />
          Vocal
        </Button>
        <Button
          variant={inputMode === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setInputMode('text')}
          className="rounded-full px-6 py-2"
        >
          <Keyboard className="w-4 h-4 mr-2" />
          Texte
        </Button>
      </div>

      {/* Main Action Button */}
      <div className="flex flex-col items-center space-y-4">
        <Button
          className="w-24 h-24 rounded-full bg-cuizly-assistant hover:bg-cuizly-assistant/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={() => {
            // TODO: Implement voice/text functionality
            console.log('Starting conversation in', inputMode, 'mode');
          }}
        >
          <Mic className="w-8 h-8" />
        </Button>
        <p className="text-cuizly-neutral text-center">
          Appuyez pour démarrer une conversation vocale
        </p>
      </div>
    </div>
  );
};

export default VoiceChatInterface;