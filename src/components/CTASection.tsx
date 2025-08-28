import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import heroRestaurantImage from "@/assets/hero-restaurant.jpg";

const CTASection = () => {
  return (
    <section className="py-20 sm:py-32 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-background to-muted/30 border border-border/50 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-2xl backdrop-blur-sm overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <img 
              src={heroRestaurantImage} 
              alt="Restaurant moderne à Montréal"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          {/* Content */}
          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight text-white">
              Prêt à révolutionner votre<br />
              expérience culinaire ?
            </h2>

            <p className="text-xl sm:text-2xl text-white/90 mb-12 sm:mb-16 leading-relaxed max-w-4xl mx-auto">
              Rejoignez dès maintenant la communauté Cuizly et soyez parmi les premiers 
              à découvrir les meilleures offres de Montréal.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-white hover:bg-white/90 text-black px-8 sm:px-12 py-4 text-lg sm:text-xl font-semibold shadow-xl hover:shadow-2xl rounded-2xl transition-all duration-300"
                >
                  Créer mon compte
                  <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </Link>

              <div className="text-center">
                <div className="text-sm text-white/80 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                  Inscription gratuite • Sans engagement
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;