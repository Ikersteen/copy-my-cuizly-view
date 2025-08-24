import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import MissionVisionSection from "@/components/MissionVisionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { SavedFavoritesSection } from "@/components/SavedFavoritesSection";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Bienvenue sur Cuizly</h1>
        <p className="text-xl text-center text-muted-foreground">
          Votre plateforme foodtech montréalaise
        </p>
      </div>
    </div>
  );
};

export default Index;