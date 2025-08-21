import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm text-cuizly-neutral mb-8">
          🇨🇦 Montréal • Nouveau
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Découvrez les<br />
          meilleures offres<br />
          culinaires
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-cuizly-neutral max-w-2xl mx-auto mb-12">
          Intelligence artificielle. Recommandations personnalisées. Les<br />
          meilleures adresses de Montréal selon vos goûts.
        </p>

        {/* CTA */}
        <Link to="/auth">
          <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-8 py-3 text-lg">
            Commencer maintenant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">1+</div>
            <div className="text-sm text-cuizly-neutral">Restaurants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">AI</div>
            <div className="text-sm text-cuizly-neutral">Personnalisé</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">MTL</div>
            <div className="text-sm text-cuizly-neutral">Montréal</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;