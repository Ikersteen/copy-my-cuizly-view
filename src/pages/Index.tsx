import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSectionLanding from "@/components/FeaturesSectionLanding";
import PricingSectionLanding from "@/components/PricingSectionLanding";
import ContactSectionLanding from "@/components/ContactSectionLanding";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSectionLanding />
      <HowItWorksSection />
      <PricingSectionLanding />
      <ContactSectionLanding />
      <CTASection />
      <Footer />
    </>
  );
};

export default Index;