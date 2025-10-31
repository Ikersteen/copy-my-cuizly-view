import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSectionLanding from "@/components/FeaturesSectionLanding";
import PerformanceDashboardSection from "@/components/PerformanceDashboardSection";
import PricingSectionLanding from "@/components/PricingSectionLanding";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();

  return (
    <>
      <HeroSection />
      
      <FeaturesSectionLanding />
      <PerformanceDashboardSection />
      <HowItWorksSection />
      <PricingSectionLanding />
      <CTASection />
      <Footer />
    </>
  );
};

export default Index;