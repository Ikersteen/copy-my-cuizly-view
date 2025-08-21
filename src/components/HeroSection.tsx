import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] bg-gradient-hero flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Location Badge - Minimal */}
          <div className="inline-flex items-center space-x-2 bg-cuizly-surface/60 backdrop-blur-sm rounded-full px-4 py-2 mb-12 border border-border/50">
            <span className="text-base">🍁</span>
            <span className="text-sm font-medium text-foreground">Montréal, QC</span>
          </div>

          {/* Main Title - Clean Typography */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
            Découvrez les<br />
            <span className="text-cuizly-primary">meilleures offres</span><br />
            culinaires de Montréal
          </h1>

          {/* Subtitle - Minimal */}
          <p className="text-lg md:text-xl text-cuizly-neutral max-w-2xl mx-auto mb-12 leading-relaxed">
            Les meilleures adresses culinaires de Montréal, choisies pour toi par l'IA. 
            Cuizly sélectionne les meilleures offres selon tes préférences.
          </p>

          {/* CTA Button - Clean */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white px-8 py-4 text-base font-medium shadow-card hover:shadow-elevated transition-all duration-200"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;