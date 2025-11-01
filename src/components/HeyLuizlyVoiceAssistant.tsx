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
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.error('Erreur de reconnaissance vocale:', event.error);
      }
      isRecognitionRunningRef.current = false;
      
      if (event.error === 'no-speech' && enabled && !isActive) {
        setTimeout(() => {
          if (enabled && !isActive && recognitionRef.current && !isRecognitionRunningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Silent restart
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;
      
      if (enabled && !isActive && !hasStartedListeningRef.current) {
        setTimeout(() => {
          if (enabled && !isActive && recognitionRef.current && !isRecognitionRunningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              // Silent restart
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
      } catch (e) {
        // Silent start
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

      // Démarrer le timeout d'inactivité de 15 secondes
      startInactivityTimeout();

    } catch (error) {
      console.error('Error activating voice assistant:', error);
      deactivateVoiceAssistant();
    }
  };

  const startInactivityTimeout = () => {
    // Annuler le timeout précédent s'il existe
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Démarrer un nouveau timeout de 15 secondes
    inactivityTimeoutRef.current = setTimeout(() => {
      deactivateVoiceAssistant();
    }, 15000);
  };

  const resetInactivityTimeout = () => {
    startInactivityTimeout();
  };

  const deactivateVoiceAssistant = () => {
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
          // Silent restart
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
    // Réinitialiser le timeout pour tout événement de conversation active
    if (event.type === 'input_audio_buffer.speech_started' ||
        event.type === 'input_audio_buffer.speech_stopped' ||
        event.type === 'input_audio_buffer.committed' ||
        event.type === 'response.created' ||
        event.type === 'response.output_item.added' ||
        event.type === 'response.content_part.added' ||
        event.type === 'response.audio.delta' ||
        event.type === 'response.audio_transcript.delta') {
      resetInactivityTimeout();
    }

    // Gérer les états visuels
    if (event.type === 'input_audio_buffer.speech_started') {
      setState('listening');
    } else if (event.type === 'response.audio.delta') {
      setState('speaking');
    } else if (event.type === 'response.audio.done') {
      setState('listening');
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