import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-8 sm:py-12 md:py-16 lg:py-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mobile-friendly-spacing">
        {/* Location Badge */}
        <div className="inline-flex items-center bg-gradient-to-r from-primary/8 to-primary/12 border border-primary/15 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm font-semibold text-primary mb-4 sm:mb-6 shadow-lg backdrop-blur-md animate-fade-in touch-target">
          <Sparkles className="mr-2 h-4 w-4 star-logo" />
          {t('hero.badge')}
        </div>

        {/* Main Title */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight animate-fade-in px-2">
          <span className="block">{t('hero.title.discover')}</span>
          <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent font-extrabold">
            {t('hero.title.favorites')}
          </span>
          <span className="block text-foreground/90">{t('hero.title.location')}</span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground/90 max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed font-normal animate-fade-in px-4"
          dangerouslySetInnerHTML={{ __html: t('hero.subtitle') }}
        />

        {/* CTA */}
        <div className="animate-fade-in px-4">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-6 sm:px-8 md:px-10 lg:px-12 py-4 sm:py-5 text-base sm:text-lg lg:text-xl font-semibold shadow-2xl hover:shadow-primary/25 border border-primary/20 mobile-button w-full sm:w-auto max-w-sm mx-auto touch-device focus-touch">
              {t('hero.cta')}
              <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;