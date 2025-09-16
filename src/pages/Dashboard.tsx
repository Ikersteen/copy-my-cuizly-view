import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import ConsumerDashboard from "./ConsumerDashboard";
import RestaurantDashboard from "./RestaurantDashboard";

const Dashboard = () => {
  const { user, profile, loading, isAuthenticated } = useUserProfile();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [loading, isAuthenticated, navigate]);

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