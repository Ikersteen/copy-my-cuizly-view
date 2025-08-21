import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] bg-gradient-hero flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Location Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <span className="text-lg">🇨🇦</span>
            <span className="text-sm font-medium text-cuizly-primary">Montréal</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-cuizly-accent font-medium">Nouveau</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-cuizly-primary mb-6 leading-tight">
            <span className="text-cuizly-accent">Ton prochain</span><br />
            <span className="text-cuizly-accent">coup de cœur</span><br />
            <span className="text-cuizly-primary">culinaire en un swipe</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-cuizly-primary-light max-w-2xl mx-auto mb-8 leading-relaxed">
            Trouvez facilement les meilleures offres culinaires à Montréal grâce à l'IA. Connectons les gourmets aux meilleures adresses.
          </p>

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white px-8 py-4 text-base font-medium shadow-elevated hover:shadow-card transition-all duration-300"
          >
            Commencer maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;