import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ConsumerDashboard from "./ConsumerDashboard";
import RestaurantDashboard from "./RestaurantDashboard";

interface Profile {
  user_type: 'consumer' | 'restaurant_owner';
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        // Check session with proper error handling
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error, redirecting to auth:', sessionError);
          navigate('/auth');
          return;
        }
        
        if (!session) {
          console.log('No session found, redirecting to auth');
          navigate('/auth');
          return;
        }

        // Get user profile with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount < maxRetries) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!error) {
              setProfile(data || { user_type: 'consumer' });
              break;
            } else {
              console.error(`Profile fetch error (attempt ${retryCount + 1}):`, error);
              if (retryCount === maxRetries - 1) {
                // Default to consumer after all retries
                console.log('Defaulting to consumer profile after retry failures');
                setProfile({ user_type: 'consumer' });
              }
            }
          } catch (fetchError) {
            console.error(`Network error (attempt ${retryCount + 1}):`, fetchError);
            if (retryCount === maxRetries - 1) {
              setProfile({ user_type: 'consumer' });
            }
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('Critical error in getProfile:', error);
        setProfile({ user_type: 'consumer' });
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
          <div className="text-center">
            <div className="space-y-2">
            <p className="text-cuizly-neutral font-medium">Chargement de votre tableau de bord...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-cuizly-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user type
  return profile?.user_type === 'restaurant_owner' ? <RestaurantDashboard /> : <ConsumerDashboard />;
};

export default Dashboard;