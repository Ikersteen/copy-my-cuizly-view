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
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-12 sm:py-16 lg:py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 text-center mobile-friendly-spacing">


        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight tracking-tight animate-fade-in">
          <span className="block">{t('hero.title.discover')}</span>
          <span className="block">{t('hero.title.favorites')}</span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in"
          dangerouslySetInnerHTML={{ __html: t('hero.subtitle') }}
        />

        {/* CTA */}
        <div className="animate-fade-in flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link to="/auth?type=restaurant&tab=signup" className="w-full sm:w-auto">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base font-semibold w-full sm:w-auto">
              {t('hero.createAccount')}
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline"
            className="bg-background border-2 border-input hover:bg-accent px-8 py-6 text-base font-semibold w-full sm:w-auto"
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