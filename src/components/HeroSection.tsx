import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-b from-background to-muted/30 py-16 sm:py-20 md:py-24 lg:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-primary/5 border border-primary/10 px-4 py-2 rounded-full text-sm text-primary font-medium mb-8 sm:mb-10 shadow-sm backdrop-blur-sm">
          <span className="mr-2">🇨🇦</span>
          Montréal • Nouveau
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 sm:mb-8 leading-tight tracking-tight px-2 sm:px-0">
          Découvrez vos prochains<br />
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">coups de cœur culinaires</span><br />
          à Montréal
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-16 px-2 sm:px-4 leading-relaxed">
          Grâce à notre intelligence artificielle, découvrez les meilleurs restaurants de Montréal adaptés à vos goûts et à votre budget.
        </p>

        {/* CTA */}
        <Link to="/auth">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-10 py-4 text-lg sm:text-xl rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
            Commencer maintenant
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;