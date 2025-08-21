import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import heroRestaurantImage from "@/assets/hero-restaurant.jpg";

const CTASection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroRestaurantImage} 
          alt="Restaurant moderne à Montréal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
          <Bell className="h-5 w-5 mr-2 text-cuizly-accent" />
          <span className="text-sm font-medium">Lancement prévu début 2025</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Prêt à révolutionner votre<br />
          expérience culinaire ?
        </h2>

        <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
          Rejoignez dès maintenant la communauté Cuizly et soyez parmi les premiers 
          à découvrir les meilleures offres de Montréal.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth">
            <Button 
              size="lg" 
              className="bg-white text-cuizly-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold"
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <div className="text-center sm:text-left">
            <div className="text-sm text-white/80 mb-1">
              Déjà <span className="font-semibold text-cuizly-accent">500+</span> restaurants partenaires
            </div>
            <div className="text-xs text-white/70">
              Inscription gratuite • Sans engagement
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-cuizly-accent/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-cuizly-primary/20 rounded-full blur-xl"></div>
      </div>
    </section>
  );
};

export default CTASection;