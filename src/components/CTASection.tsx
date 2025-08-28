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
              className="w-full h-full object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/20"></div>
          </div>

          {/* Content */}
          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight text-foreground">
              Prêt à révolutionner votre<br />
              expérience culinaire ?
            </h2>

            <p className="text-xl sm:text-2xl text-foreground/70 mb-12 sm:mb-16 leading-relaxed max-w-4xl mx-auto">
              Rejoignez dès maintenant la communauté Cuizly et soyez parmi les premiers 
              à découvrir les meilleures offres de Montréal.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-12 py-4 text-lg sm:text-xl font-semibold shadow-xl hover:shadow-2xl rounded-2xl transition-all duration-300"
                >
                  Créer mon compte
                  <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </Link>

              <div className="text-center">
                <div className="text-sm text-foreground/60 bg-background/20 px-4 py-2 rounded-full backdrop-blur-sm border border-border/30">
                  Inscription gratuite • Sans engagement
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 w-24 h-24 sm:w-28 sm:h-28 bg-primary/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;