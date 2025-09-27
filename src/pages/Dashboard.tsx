import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProfile } from "@/hooks/useProfile";
import { generateUserUrl, extractSlugFromUrl } from "@/lib/urlUtils";
import { useTranslation } from "react-i18next";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import ConsumerDashboard from "./ConsumerDashboard";
import RestaurantDashboard from "./RestaurantDashboard";

const Dashboard = () => {
  const { user, profile, loading, isAuthenticated } = useUserProfile();
  const { profile: userProfile } = useProfile();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { i18n, t } = useTranslation();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  
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

  // Redirect to personalized URL if user is on generic dashboard
  useEffect(() => {
    if (!loading && !redirecting && isAuthenticated && profile && userProfile) {
      const currentPath = window.location.pathname;
      const currentSlug = extractSlugFromUrl(currentPath);
      
      // If user is on generic /dashboard or /tableau-de-bord without slug, redirect to personalized URL
      if (currentPath === '/dashboard' || currentPath === '/tableau-de-bord') {
        setRedirecting(true);
        const personalizedUrl = generateUserUrl(
          profile.user_type,
          userProfile,
          restaurant,
          i18n.language
        );
        navigate(personalizedUrl, { replace: true });
        return;
      }
      
      // If user has a slug but profile data suggests it should be different, update if needed
      if (currentSlug) {
        const expectedUrl = generateUserUrl(
          profile.user_type,
          userProfile,
          restaurant,
          i18n.language
        );
        const expectedSlug = extractSlugFromUrl(expectedUrl);
        
        // Only redirect if the slug is significantly different (not just language path difference)
        if (expectedSlug && currentSlug !== expectedSlug) {
          setRedirecting(true);
          navigate(expectedUrl, { replace: true });
          return;
        }
      }
    }
  }, [loading, redirecting, isAuthenticated, profile, userProfile, restaurant, i18n.language, navigate]);

  // Set dynamic page title based on personalized URL
  useEffect(() => {
    if (profile && userProfile) {
      let title = "Cuizly";
      
      if (profile.user_type === 'consumer') {
        const displayName = userProfile.first_name 
          ? `${userProfile.first_name}${userProfile.last_name ? ` ${userProfile.last_name}` : ''}`
          : userProfile.username || t('auth.consumer');
        title = `${displayName} - Cuizly`;
      } else if (profile.user_type === 'restaurant_owner' && restaurant?.name) {
        title = `${restaurant.name} - Cuizly`;
      }
      
      document.title = title;
    }
  }, [profile, userProfile, restaurant, t]);

  if (loading || redirecting) {
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