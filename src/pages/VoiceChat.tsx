import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocalizedRoute } from '@/lib/routeTranslations';
import VoiceChatInterface from '@/components/VoiceChatInterface';
import LoadingSpinner from '@/components/LoadingSpinner';

const VoiceChat = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const authRoute = useLocalizedRoute('/auth');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate(authRoute, { replace: true });
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate(authRoute, { replace: true });
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, authRoute]);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <VoiceChatInterface />
    </div>
  );
};

export default VoiceChat;