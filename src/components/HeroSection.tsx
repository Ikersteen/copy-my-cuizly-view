import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileSwitchModal } from "@/components/ProfileSwitchModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 pt-2 pb-6 sm:py-16 lg:py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 text-center mobile-friendly-spacing">


        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-3 sm:mb-4 leading-[1.6] tracking-tight animate-fade-in pb-0">
          <span className="block">{t('hero.title.discover')}</span>
          <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent font-extrabold pb-2">
            {t('hero.title.favorites')}
          </span>
          <span className="block text-foreground/90">{t('hero.title.location')}</span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-base sm:text-xl md:text-2xl text-muted-foreground/90 max-w-4xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal animate-fade-in"
          dangerouslySetInnerHTML={{ __html: t('hero.subtitle') }}
        />

        {/* CTA */}
        <div className="animate-fade-in flex flex-col sm:flex-row gap-3 sm:gap-2 justify-center items-center">
          <Link to="/auth?type=restaurant&tab=signup" className="w-full sm:w-auto">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-10 sm:px-8 py-5 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-primary/25 border border-primary/20 min-h-[60px] w-full sm:w-auto touch-device">
              {t('hero.createAccount')}
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline"
            className="bg-transparent border-2 border-primary/20 text-primary hover:bg-primary/10 px-10 sm:px-8 py-5 text-lg sm:text-xl font-semibold min-h-[60px] w-full sm:w-auto touch-device"
            onClick={() => window.open('https://calendly.com/cuizlycanada/30min', '_blank')}
          >
            {t('hero.bookDemo')}
          </Button>
        </div>

        {/* Profile Switch Modal removed - always redirect to auth */}
      </div>
    </section>
  );
};

export default HeroSection;