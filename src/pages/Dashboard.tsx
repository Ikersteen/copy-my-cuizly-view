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
          <div className="relative w-12 h-12 bg-gradient-to-br from-cuizly-primary to-cuizly-accent rounded-full flex items-center justify-center shadow-lg animate-pulse mx-auto mb-4">
            <span className="text-background font-bold text-xl">C</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cuizly-primary to-cuizly-accent opacity-20 animate-ping"></div>
          </div>
          <p className="text-cuizly-neutral">Chargement...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user type
  return profile?.user_type === 'restaurant_owner' ? <RestaurantDashboard /> : <ConsumerDashboard />;
};

export default Dashboard;