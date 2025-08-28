import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import heroRestaurantImage from "@/assets/hero-restaurant.jpg";

const CTASection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="relative bg-gradient-to-br from-background to-muted/30 border border-border/50 rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 shadow-2xl backdrop-blur-sm overflow-hidden">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 leading-[1.1] tracking-tight text-white">
              Prêt à révolutionner votre<br />
              expérience culinaire ?
            </h2>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 sm:mb-10 md:mb-12 leading-relaxed max-w-4xl mx-auto font-normal">
              Rejoignez dès maintenant la communauté Cuizly et soyez parmi les premiers 
              à découvrir les meilleures offres de Montréal.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-white hover:bg-white/90 text-black px-8 sm:px-10 md:px-12 py-4 sm:py-5 text-base sm:text-lg md:text-xl font-semibold shadow-xl hover:shadow-2xl rounded-2xl transition-all duration-300 min-h-[56px] sm:min-h-[60px] w-full sm:w-auto max-w-sm mx-auto"
                >
                  Créer mon compte
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
              </Link>

              <div className="text-center">
                <div className="text-xs sm:text-sm text-white/80 bg-black/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/20">
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