import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import ConsumerDashboard from "./ConsumerDashboard";
import RestaurantDashboard from "./RestaurantDashboard";

const Dashboard = () => {
  const { user, profile, loading, isAuthenticated } = useUserProfile();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  
  // Get localized routes
  const authRoute = useLocalizedRoute('/auth');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(authRoute);
    }
  }, [loading, isAuthenticated, navigate, authRoute]);

  // Load restaurant data if user is restaurant owner
  useEffect(() => {
    const loadRestaurant = async () => {
      if (profile?.user_type === 'restaurant_owner' && user?.id) {
        try {
          const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();
          
          setRestaurant(restaurantData);
        } catch (error) {
          console.error('Error loading restaurant:', error);
        }
      }
    };

    if (!loading && isAuthenticated && profile) {
      loadRestaurant();
    }
  }, [loading, isAuthenticated, profile, user?.id]);


  // Render appropriate dashboard based on user type
  return profile?.user_type === 'restaurant_owner' ? <RestaurantDashboard /> : <ConsumerDashboard />;
};

export default Dashboard;