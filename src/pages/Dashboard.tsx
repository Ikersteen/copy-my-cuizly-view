import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import ConsumerDashboard from "./ConsumerDashboard";
import RestaurantDashboard from "./RestaurantDashboard";

const Dashboard = () => {
  const { user, profile, loading, isAuthenticated, refreshProfile } = useUserProfile();
  const navigate = useNavigate();

  // Debug logging
  console.log('Dashboard - User:', user?.id, 'Profile:', profile, 'Loading:', loading);

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
  return (
    <div>
      {/* Debug info - remove after fixing */}
      <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
        User: {user?.email}<br/>
        Profile: {profile?.user_type}<br/>
        <button 
          onClick={refreshProfile}
          className="bg-blue-500 px-2 py-1 rounded mt-1"
        >
          Refresh Profile
        </button>
      </div>
      
      {profile?.user_type === 'restaurant_owner' ? <RestaurantDashboard /> : <ConsumerDashboard />}
    </div>
  );
};

export default Dashboard;