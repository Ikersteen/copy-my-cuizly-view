import IOSHeroSection from "@/components/IOSHeroSection";
import IOSFeaturesSection from "@/components/IOSFeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PerformanceDashboardSection from "@/components/PerformanceDashboardSection";
import PricingSectionLanding from "@/components/PricingSectionLanding";
import ContactSectionLanding from "@/components/ContactSectionLanding";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import IOSBottomTabBar from "@/components/IOSBottomTabBar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <IOSHeroSection />
      <IOSFeaturesSection />
      <PerformanceDashboardSection />
      <HowItWorksSection />
      <PricingSectionLanding />
      <ContactSectionLanding />
      <CTASection />
      <Footer />
      
      {/* iOS-style Bottom Tab Bar for Mobile */}
      {isMobile && <IOSBottomTabBar />}
    </div>
  );
};

export default Index;