import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import heroRestaurantImage from "@/assets/hero-restaurant.jpg";

const CTASection = () => {
  const { t } = useTranslation();
  return (
    <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroRestaurantImage} 
          alt={t('cta.imageAlt')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight px-2 sm:px-0">
          {t('cta.title')}
        </h2>

        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-2 sm:px-4">
          {t('cta.description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth" className="group">
            <Button 
              size="lg" 
              className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fade-in relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {t('cta.button')}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Button>
          </Link>

          <div className="text-center sm:text-left">
            <div className="text-xs text-white/70">
              {t('cta.disclaimer')}
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/20 rounded-full blur-xl"></div>
      </div>
    </section>
  );
};

export default CTASection;