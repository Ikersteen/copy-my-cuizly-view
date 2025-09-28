import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { Search, MapPin, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const IOSHeroSection = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const authRoute = useLocalizedRoute('/auth');

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-background to-accent/5 flex flex-col items-center justify-center px-4 py-20 safe-area-top">
      {/* Background Pattern - iOS Style */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-md mx-auto space-y-8">
        {/* App Icon */}
        <div className="mx-auto w-24 h-24 bg-primary rounded-3xl shadow-xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <img 
            src="/cuizly-icon-hd.png" 
            alt="Cuizly" 
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Cuizly
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Search Preview - iOS Style */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Search className="h-5 w-5" />
            <span className="text-sm">{t('hero.searchPlaceholder')}</span>
          </div>
          <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-border/30">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">Montréal, QC</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link to={authRoute} className="block">
            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-4 font-semibold shadow-lg active:scale-95 transition-all duration-200"
            >
              {t('hero.cta')}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg"
            className="w-full border-border/50 rounded-2xl py-4 font-medium active:scale-95 transition-all duration-200"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('hero.learnMore')}
          </Button>
        </div>

        {/* Quick Stats - iOS Style */}
        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">500+</div>
            <div className="text-xs text-muted-foreground">{t('hero.restaurants')}</div>
          </div>
          <div className="text-center border-x border-border/30">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl font-bold text-primary">4.9</span>
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            </div>
            <div className="text-xs text-muted-foreground">{t('hero.rating')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">10k+</div>
            <div className="text-xs text-muted-foreground">{t('hero.users')}</div>
          </div>
        </div>
      </div>

      {/* Bottom Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-1 h-8 bg-muted-foreground/30 rounded-full"></div>
      </div>
    </section>
  );
};

export default IOSHeroSection;