import React, { useEffect, useState, useRef } from 'react';
import VoiceActivationOrb from './VoiceActivationOrb';
import { RealtimeVoiceClient } from '@/utils/RealtimeVoiceClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface HeyLuizlyVoiceAssistantProps {
  enabled: boolean;
}

const HeyLuizlyVoiceAssistant: React.FC<HeyLuizlyVoiceAssistantProps> = ({ enabled }) => {
  const [state, setState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const realtimeClientRef = useRef<RealtimeVoiceClient | null>(null);
  const recognitionRef = useRef<any>(null);
  const hasStartedListeningRef = useRef(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRecognitionRunningRef = useRef(false);

  // Initialiser la reconnaissance vocale pour "Hey Cuizly"
  useEffect(() => {
    if (!enabled) {
      stopAllServices();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      toast({
        title: t('common.error'),
        description: "La reconnaissance vocale n'est pas supportée sur ce navigateur",
        variant: 'destructive'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Changé à true pour obtenir des résultats intermédiaires
    recognition.lang = 'fr-CA';
    recognition.maxAlternatives = 3; // Augmenter les alternatives

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase();
      const confidence = event.results[last][0].confidence;
      
      console.log('🎤 Entendu:', transcript, '(confiance:', confidence, ')');

      if (transcript.includes('hey cuizly') || 
          transcript.includes('hey cuisely') || 
          transcript.includes('ey cuizly') ||
          transcript.includes('hé cuizly') ||
          transcript.includes('et cuizly')) {
        console.log('✅ Mot d\'activation détecté!');
        activateVoiceAssistant();
      }
    };

    recognition.onstart = () => {
      isRecognitionRunningRef.current = true;
      console.log('🎤 Reconnaissance vocale démarrée - dites "Hey Cuizly"');
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.error('Erreur de reconnaissance vocale:', event.error);
        
        if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone requis',
            description: 'Veuillez autoriser l\'accès au microphone pour utiliser "Hey Cuizly"',
            variant: 'destructive'
          });
        }
      }
      isRecognitionRunningRef.current = false;
      
      if (event.error === 'no-speech' && enabled && !isActive) {
        setTimeout(() => {
          if (enabled && !isActive && recognitionRef.current && !isRecognitionRunningRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🔄 Reconnaissance vocale redémarrée');
            } catch (e) {
              console.log('Erreur de redémarrage:', e);
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;
      console.log('🛑 Reconnaissance vocale arrêtée');
      
      if (enabled && !isActive && !hasStartedListeningRef.current) {
        setTimeout(() => {
          if (enabled && !isActive && recognitionRef.current && !isRecognitionRunningRef.current) {
            try {
              recognition.start();
              console.log('🔄 Reconnaissance vocale redémarrée automatiquement');
            } catch (e) {
              console.log('Erreur de redémarrage:', e);
            }
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    // Démarrer l'écoute passive
    if (!hasStartedListeningRef.current) {
      try {
        recognition.start();
        hasStartedListeningRef.current = true;
        console.log('🎧 Écoute active pour "Hey Cuizly"...');
        
        toast({
          title: 'Cuizly Assistant',
          description: 'Dites "Hey Cuizly" pour activer l\'assistant vocal',
        });
      } catch (e) {
        console.log('Erreur de démarrage:', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Erreur d\'arrêt:', e);
        }
        recognitionRef.current = null;
        hasStartedListeningRef.current = false;
      }
    };
  }, [enabled, isActive, toast, t]);

  const activateVoiceAssistant = async () => {
    if (isActive) return;

    try {
      setState('listening');
      setIsActive(true);

      // Arrêter la reconnaissance du wake word
      if (recognitionRef.current && isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.stop();
          isRecognitionRunningRef.current = false;
          hasStartedListeningRef.current = false;
        } catch (e) {
          console.log('Stop recognition error:', e);
        }
      }

      // Démarrer la conversation avec OpenAI Realtime
      const client = new RealtimeVoiceClient((event) => {
        handleRealtimeEvent(event);
      });

      await client.connect();
      realtimeClientRef.current = client;

      console.log('✅ Cuizly Assistant activé - En écoute...');

      // Envoyer un message de confirmation
      if (realtimeClientRef.current) {
        toast({
          title: 'Cuizly Assistant',
          description: 'Je vous écoute! Posez-moi votre question.',
        });
      }

      // Démarrer le timeout d'inactivité de 3 secondes
      startInactivityTimeout();

    } catch (error) {
      console.error('Error activating voice assistant:', error);
      toast({
        title: t('common.error'),
        description: "Impossible d'activer l'assistant vocal",
        variant: 'destructive'
      });
      deactivateVoiceAssistant();
    }
  };

  const startInactivityTimeout = () => {
    // Annuler le timeout précédent s'il existe
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Démarrer un nouveau timeout de 3 secondes
    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Inactivity timeout - deactivating assistant');
      deactivateVoiceAssistant();
    }, 3000);
  };

  const resetInactivityTimeout = () => {
    startInactivityTimeout();
  };

  const deactivateVoiceAssistant = () => {
    console.log('🛑 Deactivating Cuizly Assistant...');
    
    // Annuler le timeout d'inactivité
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }

    setState('idle');
    setIsActive(false);
    hasStartedListeningRef.current = false;

    // Redémarrer l'écoute du wake word
    if (enabled && recognitionRef.current && !isRecognitionRunningRef.current) {
      setTimeout(() => {
        try {
          if (!isRecognitionRunningRef.current) {
            recognitionRef.current.start();
            hasStartedListeningRef.current = true;
          }
        } catch (e) {
          console.log('Restart recognition error:', e);
        }
      }, 1000);
    }
  };

  const stopAllServices = () => {
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionRunningRef.current = false;
      } catch (e) {
        console.log('Stop recognition error:', e);
      }
      recognitionRef.current = null;
    }
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    setState('idle');
    setIsActive(false);
    hasStartedListeningRef.current = false;
  };

  const handleRealtimeEvent = (event: any) => {
    // Gérer les événements de l'API Realtime
    if (event.type === 'response.audio_transcript.delta') {
      setState('speaking');
      resetInactivityTimeout(); // Réinitialiser le timeout quand l'assistant parle
    } else if (event.type === 'response.audio_transcript.done') {
      setState('listening');
      startInactivityTimeout(); // Redémarrer le timeout après la réponse
    } else if (event.type === 'input_audio_buffer.speech_started') {
      setState('listening');
      resetInactivityTimeout(); // Réinitialiser le timeout quand l'utilisateur parle
    } else if (event.type === 'error') {
      console.error('Realtime error:', event);
      deactivateVoiceAssistant();
    }
  };

  const handleOrbClick = () => {
    if (isActive) {
      deactivateVoiceAssistant();
    } else {
      activateVoiceAssistant();
    }
  };

  if (!enabled) {
    return null;
  }

  return <VoiceActivationOrb state={state} onClick={handleOrbClick} />;
};

export default HeyLuizlyVoiceAssistant;