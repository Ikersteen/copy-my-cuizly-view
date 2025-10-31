import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroRestaurantImage from "@/assets/get-cuizly-restaurant.jpg";

const HeroSection = () => {
  const { t } = useTranslation();
  const { isAuthenticated, profile } = useUserProfile();
  const [showProfileSwitch, setShowProfileSwitch] = useState(false);
  const navigate = useNavigate();

  // Removed handleCTAClick - always redirect to auth

  const handleSwitchToRestaurant = () => {
    navigate('/auth');
  };

  const handleSwitchToConsumer = () => {
    navigate('/auth');
  };
  
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroRestaurantImage} 
          alt="Cuizly restaurant management"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 text-center mobile-friendly-spacing">


        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 sm:mb-4 leading-[1.6] tracking-tight animate-fade-in pb-0 sm:pb-3">
          <span className="block">{t('hero.title.discover')}</span>
          <span className="block bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent font-extrabold pb-2">
            {t('hero.title.favorites')}
          </span>
          <span className="block text-white/90">{t('hero.title.location')}</span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-base sm:text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal animate-fade-in"
          dangerouslySetInnerHTML={{ __html: t('hero.subtitle') }}
        />

        {/* CTA */}
        <div className="animate-fade-in flex justify-center items-center">
          <Link to="/auth?type=restaurant&tab=signup" className="w-full sm:w-auto">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-10 sm:px-8 py-5 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-white/25 min-h-[60px] w-full sm:w-auto touch-device">
              {t('hero.createAccount')}
            </Button>
          </Link>
        </div>

        {/* Profile Switch Modal removed - always redirect to auth */}
      </div>
    </section>
  );
};

export default HeroSection;