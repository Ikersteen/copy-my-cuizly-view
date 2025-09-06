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
      
      {/* Promotion nouvelle interface vocale */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              🎙️ Nouvelle Interface Vocale
            </h3>
            <p className="text-gray-600 mb-6">
              Découvrez notre nouvelle interface vocale épurée, inspirée de tryapril.com, 
              avec l'architecture hybride ChatGPT + ElevenLabs
            </p>
            <a 
              href="/voice" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
            >
              Essayer l'Interface Vocale →
            </a>
          </div>
        </div>
      </section>
      
      <MissionSection />
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