import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRestaurantCount } from "@/hooks/useRestaurantCount";

const HeroSection = () => {
  const restaurantCount = useRestaurantCount();

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-4 py-2 rounded-full text-sm text-primary font-medium mb-8 shadow-sm">
          <span className="mr-1">🇨🇦</span>
          Montréal • Nouveau
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 md:mb-8 leading-tight tracking-tight">
          Découvrez vos prochains<br />
          <span className="text-cuizly-accent">coups de cœur culinaires</span><br />
          à Montréal
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-cuizly-neutral max-w-4xl mx-auto mb-10 md:mb-14 px-4 leading-relaxed">
          Grâce à notre intelligence artificielle, profitez de recommandations personnalisées<br className="hidden sm:block" />
          et trouvez facilement les meilleures adresses en ville, adaptées à vos goûts et à votre budget.
        </p>

        {/* CTA */}
        <Link to="/auth">
          <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-8 py-3 text-lg">
            Commencer maintenant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-lg md:max-w-2xl mx-auto mt-16 md:mt-20">
          <div className="text-center group">
            <div className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-cuizly-accent transition-colors duration-300">
              {restaurantCount}+
            </div>
            <div className="text-sm md:text-base text-cuizly-neutral mt-1">
              Restaurants partenaires
            </div>
          </div>
          <div className="text-center group">
            <div className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-cuizly-accent transition-colors duration-300">
              IA
            </div>
            <div className="text-sm md:text-base text-cuizly-neutral mt-1">
              Recommandations personnalisées
            </div>
          </div>
          <div className="text-center group">
            <div className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-cuizly-accent transition-colors duration-300">
              MTL
            </div>
            <div className="text-sm md:text-base text-cuizly-neutral mt-1">
              Montréal & environs
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;