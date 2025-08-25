import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-20 sm:py-24 md:py-32 lg:py-40">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-gradient-to-r from-primary/8 to-primary/12 border border-primary/15 px-5 py-2.5 rounded-full text-sm font-semibold text-primary mb-12 shadow-lg backdrop-blur-md animate-fade-in">
          <span className="mr-2 text-base">🇨🇦</span>
          Montréal • Nouveau
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-foreground mb-8 sm:mb-10 leading-[0.95] tracking-tighter px-2 sm:px-0 animate-fade-in">
          <span className="block">Découvrez vos prochains</span>
          <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent font-extrabold">
            coups de cœur culinaires
          </span>
          <span className="block text-foreground/90">à Montréal</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground/80 max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20 px-4 sm:px-6 leading-relaxed font-light tracking-wide animate-fade-in">
          Grâce à notre <span className="font-medium text-foreground/90">intelligence artificielle</span>, découvrez les meilleurs restaurants de Montréal adaptés à vos goûts et à votre budget.
        </p>

        {/* CTA */}
        <div className="animate-fade-in">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-10 sm:px-12 py-5 text-xl sm:text-2xl font-semibold rounded-xl shadow-2xl hover:shadow-primary/25 transition-all duration-500 hover:scale-105 border border-primary/20">
              Commencer maintenant
              <ArrowRight className="ml-4 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;