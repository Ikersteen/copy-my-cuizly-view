import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import MissionVisionSection from "@/components/MissionVisionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import RestaurantMapSection from "@/components/RestaurantMapSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { SavedFavoritesSection } from "@/components/SavedFavoritesSection";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";

const Index = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUser();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <HeroSection />
      <MissionSection />
      <MissionVisionSection />
      <RestaurantMapSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </>
  );
};

export default Index;