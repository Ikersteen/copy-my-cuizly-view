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
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-12 sm:py-16 md:py-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 text-center mobile-friendly-spacing">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-gradient-to-r from-primary/8 to-primary/12 border border-primary/15 px-5 py-2.5 rounded-full text-sm font-semibold text-primary mb-4 shadow-lg backdrop-blur-md animate-fade-in">
          <Sparkles className="mr-2 h-4 w-4 star-logo" />
          {t('hero.badge')}
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight animate-fade-in">
          <span className="block">{t('hero.title.discover')}</span>
          <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent font-extrabold">
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
        <div className="animate-fade-in flex flex-col sm:flex-row gap-3 sm:gap-0 justify-center items-center">
          <Link to="/auth?type=restaurant&tab=signup">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-10 sm:px-8 py-5 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-primary/25 border border-primary/20 min-h-[60px] w-full sm:w-auto touch-device">
              {t('hero.createAccount')}
              <ArrowRight className="ml-3 h-5 w-5" />
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