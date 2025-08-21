import HeroSection from "@/components/HeroSection";
import MissionVisionSection from "@/components/MissionVisionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import RestaurantsSection from "@/components/RestaurantsSection";
import StatsSection from "@/components/StatsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <MissionVisionSection />
      <HowItWorksSection />
      <RestaurantsSection />
      <CTASection />
      <Footer />
    </>
  );
};

export default Index;