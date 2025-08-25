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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      try {
        // Get user profile to determine dashboard type
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Erreur lors du chargement du profil:', error);
          // Default to consumer if profile fetch fails
          setProfile({ user_type: 'consumer' });
        } else if (data) {
          setProfile(data);
        } else {
          // No profile found - this shouldn't happen with the trigger but handle it
          setProfile({ user_type: 'consumer' });
        }
      } catch (error) {
        console.error('Erreur inattendue:', error);
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
          <div className="relative">
            {/* Logo principal avec animation */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-cuizly-primary to-cuizly-accent rounded-full flex items-center justify-center shadow-2xl animate-pulse mx-auto mb-6">
              <span className="text-background font-bold text-2xl">C</span>
            </div>
            
            {/* Cercles d'animation autour du logo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-cuizly-primary/30 animate-ping"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 -mt-2 -ml-2 rounded-full border border-cuizly-accent/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
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