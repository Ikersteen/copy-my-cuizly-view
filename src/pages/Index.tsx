import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import MissionSection from "@/components/MissionSection";
import RestaurantsSection from "@/components/RestaurantsSection";
import PricingSection from "@/components/PricingSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <StatsSection />
      <MissionSection />
      <RestaurantsSection />
      <PricingSection />
    </div>
  );
};

export default Index;
