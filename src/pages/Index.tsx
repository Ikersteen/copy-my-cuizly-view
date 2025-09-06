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
      <MissionSection />
      
      {/* Démo Interface Vocale */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              🎙️ Interface Vocale Cuizly
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Découvrez notre assistant vocal intelligent qui vous aide à trouver le restaurant parfait 
              simplement en parlant. Powered by ChatGPT & ElevenLabs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Démo Vidéo */}
            <div className="relative">
              <div className="bg-card rounded-2xl shadow-xl p-8 border">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎥</span>
                    </div>
                    <p className="text-muted-foreground font-medium">Démo Vidéo à venir</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Interface vocale en action
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Comment ça marche ?</h3>
                  <p className="text-muted-foreground text-sm">
                    Parlez naturellement à Cuizly et obtenez des recommandations personnalisées
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
                  <h3 className="text-lg font-semibold mb-2">Conversation Naturelle</h3>
                  <p className="text-muted-foreground">
                    "Je cherche un restaurant italien près de chez moi" - Cuizly comprend et répond instantanément
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recommandations Précises</h3>
                  <p className="text-muted-foreground">
                    IA alimentée par ChatGPT pour des suggestions personnalisées selon vos goûts et localisation
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Réponses Vocales</h3>
                  <p className="text-muted-foreground">
                    Voix naturelle powered by ElevenLabs - écoutez les recommandations comme une vraie conversation
                  </p>
                </div>
              </div>
              
              <div className="pt-6">
                <a 
                  href="/voice" 
                  className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  <span className="mr-3">🎙️</span>
                  Essayer l'Assistant Vocal
                  <span className="ml-3">→</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Exemples de Questions */}
          <div className="mt-16 bg-card rounded-2xl p-8 border shadow-lg">
            <h3 className="text-xl font-semibold text-center mb-6">Exemples de questions que vous pouvez poser :</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🍝</div>
                <p className="font-medium mb-1">"Restaurant italien"</p>
                <p className="text-sm text-muted-foreground">Je cherche un bon restaurant italien à Montréal</p>
              </div>
              <div className="bg-secondary/5 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🌍</div>
                <p className="font-medium mb-1">"Cuisine du monde"</p>
                <p className="text-sm text-muted-foreground">Tu peux me recommander de la cuisine africaine?</p>
              </div>
              <div className="bg-accent/5 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">💰</div>
                <p className="font-medium mb-1">"Budget spécifique"</p>
                <p className="text-sm text-muted-foreground">Un restaurant pas cher pour ce soir</p>
              </div>
            </div>
          </div>
        </div>
      </section>
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