import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-12 sm:py-16 md:py-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 text-center mobile-friendly-spacing">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-gradient-to-r from-primary/8 to-primary/12 border border-primary/15 px-5 py-2.5 rounded-full text-sm font-semibold text-primary mb-4 shadow-lg backdrop-blur-md animate-fade-in">
          <span className="mr-2 text-base">🇨🇦</span>
          Montréal • Nouveau
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight animate-fade-in">
          <span className="block">Découvrez vos prochains</span>
          <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent font-extrabold">
            coups de cœur culinaires
          </span>
          <span className="block text-foreground/90">à Montréal</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl md:text-2xl text-muted-foreground/90 max-w-4xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal animate-fade-in">
          Grâce à notre <span className="font-semibold text-foreground/95">intelligence artificielle</span>, découvrez les meilleurs restaurants de Montréal adaptés à vos goûts et à votre budget.
        </p>

        {/* CTA */}
        <div className="animate-fade-in">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-10 sm:px-12 py-5 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-primary/25 border border-primary/20 min-h-[60px] w-full sm:w-auto max-w-sm mx-auto touch-device">
              Commencer maintenant
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;