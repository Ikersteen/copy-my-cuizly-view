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

      // Get user profile to determine dashboard type
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // Default to consumer if no profile found
        setProfile({ user_type: 'consumer' });
      }
      
      setLoading(false);
    };

    getProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-cuizly-primary rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-cuizly-neutral">Chargement...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user type
  return profile?.user_type === 'restaurant_owner' ? <RestaurantDashboard /> : <ConsumerDashboard />;
};

export default Dashboard;