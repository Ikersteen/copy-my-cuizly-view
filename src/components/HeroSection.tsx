import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Main Title - Ultra clean */}
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Les meilleures offres<br />
          culinaires de <span className="text-cuizly-primary">Montréal</span>
        </h1>

        {/* Subtitle - Minimal */}
        <p className="text-xl text-cuizly-neutral max-w-2xl mx-auto mb-10">
          Découvrez les restaurants et offres sélectionnés par l'IA selon vos préférences.
        </p>

        {/* CTA */}
        <Link to="/auth">
          <Button size="lg" className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white px-8 py-3">
            Commencer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;