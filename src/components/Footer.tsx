import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocalizedRoute } from '@/lib/routeTranslations';
import { Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  
  // Get localized routes
  const featuresRoute = useLocalizedRoute('/features');
  const pricingRoute = useLocalizedRoute('/pricing');
  const contactRoute = useLocalizedRoute('/contact');
  const teamRoute = useLocalizedRoute('/team');
  const mentionsRoute = useLocalizedRoute('/mentions');
  const privacyRoute = useLocalizedRoute('/privacy');
  const termsRoute = useLocalizedRoute('/terms');
  const cookiesRoute = useLocalizedRoute('/cookies');
  
  return (
    <footer className="relative bg-card border-t border-border/50 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--cuizly-primary)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-center justify-items-center">
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.product')}</h3>
            <ul className="space-y-2 sm:space-y-3 flex flex-col items-center">
              <li>
                <Link 
                  to={featuresRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.features')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to={pricingRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.rates')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.support')}</h3>
            <ul className="space-y-2 sm:space-y-3 flex flex-col items-center">
              <li>
                <Link 
                  to={contactRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.contactUs')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.company')}</h3>
            <ul className="space-y-2 sm:space-y-3 flex flex-col items-center">
              <li>
                <Link 
                  to={teamRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.team')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to={mentionsRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.legalNotices')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.legal')}</h3>
            <ul className="space-y-2 sm:space-y-3 flex flex-col items-center">
              <li>
                <Link 
                  to={privacyRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.privacyPolicy')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to={termsRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.termsOfUse')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to={cookiesRoute}
                  className="group relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block hover:scale-105"
                >
                  {t('footer.cookiePolicy')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative border-t-2 border-border/60 mt-8 sm:mt-12 pt-8 sm:pt-10">
          
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <a 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src="/cuizly-logo-official.png" 
                alt="Cuizly" 
                className="h-[70px] w-auto transition-all duration-300 group-hover:scale-110 dark:filter dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              />
            </a>
            
            <p className="text-cuizly-neutral text-sm sm:text-base italic text-center max-w-md leading-relaxed">
              {t('footer.tagline')}
            </p>
            
            {/* Enhanced Social Links */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <a 
                href="https://www.instagram.com/cuizly"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-cuizly-neutral hover:text-cuizly-primary transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />
                <div className="absolute inset-0 -m-2 bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
              </a>
              <div className="w-px h-4 bg-border/50"></div>
              <a 
                href="https://linkedin.com/company/cuizly"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-cuizly-neutral hover:text-cuizly-primary transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6 sm:w-7 sm:h-7" />
                <div className="absolute inset-0 -m-2 bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
              </a>
              <div className="w-px h-4 bg-border/50"></div>
              <a 
                href="https://www.tiktok.com/@cuizly?_t=ZS-90bnsnMfoga&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-cuizly-neutral hover:text-cuizly-primary transition-all duration-300 hover:scale-110"
                aria-label="TikTok"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <div className="absolute inset-0 -m-2 bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
              </a>
            </div>
            
            <div className="flex items-center space-x-2 text-cuizly-neutral/80 text-xs sm:text-sm">
              <span>© 2025</span>
              <span className="font-medium">{t('footer.companyName')}</span>
              <span>•</span>
              <span>{t('footer.allRightsReserved')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;