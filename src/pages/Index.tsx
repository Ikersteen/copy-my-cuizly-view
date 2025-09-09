import HeroSection from "@/components/HeroSection";
import MissionSection from "@/components/MissionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSectionLanding from "@/components/FeaturesSectionLanding";
import PricingSectionLanding from "@/components/PricingSectionLanding";
import ContactSectionLanding from "@/components/ContactSectionLanding";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import RestaurantsSection from "@/components/RestaurantsSection";
import { RecommendationCardsSection } from "@/components/RecommendationCardsSection";
import cuizlyLogo from "/lovable-uploads/3c5c1704-3a2b-4c77-8039-43aae95c34f9.png";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();

  return (
    <>
      <HeroSection />
      <MissionSection />
      
      {/* Démo Interface Vocale */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src={cuizlyLogo} 
                alt="Cuizly" 
                className="h-12 w-auto dark:filter dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300" 
              />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              <span className="text-blue-600 dark:text-blue-400">{t('voiceAssistant.title')}</span>
            </h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('voiceAssistant.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Démo Vidéo */}
            <div className="relative">
              <div className="bg-card rounded-2xl shadow-xl p-8 border">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl overflow-hidden mb-6">
                  <img 
                    src="/lovable-uploads/6f7cb4c8-65ad-4d17-8773-ca603d754f03.png" 
                    alt="Interface vocale Cuizly en action" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{t('voiceAssistant.demo.title')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('voiceAssistant.demo.subtitle')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Fonctionnalités */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🗣️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('voiceAssistant.features.naturalConversation.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('voiceAssistant.features.naturalConversation.description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('voiceAssistant.features.preciseRecommendations.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('voiceAssistant.features.preciseRecommendations.description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t('voiceAssistant.features.voiceResponses.title')} <span className="text-red-500">{t('voiceAssistant.features.voiceResponses.comingSoon')}</span>
                  </h3>
                  <p className="text-muted-foreground">
                    {t('voiceAssistant.features.voiceResponses.description')}
                  </p>
                </div>
              </div>
              
              <div className="pt-6 text-center">
                <a 
                  href="/voice" 
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  {t('voiceAssistant.cta')}
                  <span className="ml-3">→</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Exemples de Questions */}
          <div className="mt-16 bg-card rounded-2xl p-8 border shadow-lg">
            <h3 className="text-xl font-semibold text-center mb-6">{t('voiceAssistant.examples.title')}</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-secondary/5 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🍝</div>
                <p className="font-medium mb-1">{t('voiceAssistant.examples.italian.title')}</p>
                <p className="text-sm text-muted-foreground">{t('voiceAssistant.examples.italian.question')}</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🌍</div>
                <p className="font-medium mb-1">{t('voiceAssistant.examples.african.title')}</p>
                <p className="text-sm text-muted-foreground">{t('voiceAssistant.examples.african.question')}</p>
              </div>
              <div className="bg-accent/5 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">💰</div>
                <p className="font-medium mb-1">{t('voiceAssistant.examples.budget.title')}</p>
                <p className="text-sm text-muted-foreground">{t('voiceAssistant.examples.budget.question')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <RecommendationCardsSection />
      <RestaurantsSection />
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