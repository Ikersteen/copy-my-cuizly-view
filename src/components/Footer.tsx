import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="relative bg-background border-t border-border/50 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--cuizly-primary)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.product')}</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/features" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.features')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.rates')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.support')}</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/contact" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.contactUs')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.company')}</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/mentions" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.legalNotices')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">{t('footer.legal')}</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.privacyPolicy')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.termsOfUse')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {t('footer.cookiePolicy')}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative border-t-2 border-border/60 mt-8 sm:mt-12 pt-8 sm:pt-10">
          
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <Link 
              to="/"
              className="flex items-center space-x-3 group cursor-pointer"
              onClick={() => window.location.href = '/'}
            >
              <img 
                src="/lovable-uploads/9727855b-56d5-4c89-93e2-8d3e2e8eae1e.png" 
                alt="Cuizly" 
                className="h-[70px] w-auto transition-all duration-300 group-hover:scale-110 dark:hidden"
              />
              <img 
                src="/lovable-uploads/2ca03ecc-31e6-42ef-89bf-9532213d22eb.png" 
                alt="Cuizly" 
                className="h-[70px] w-auto transition-all duration-300 group-hover:scale-110 hidden dark:block"
              />
            </Link>
            
            <p className="text-cuizly-neutral text-sm sm:text-base italic text-center max-w-md leading-relaxed">
              {t('footer.tagline')}
            </p>
            
            {/* Enhanced Social Links */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <a 
                href="https://www.instagram.com/cuizly"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-cuizly-neutral hover:text-cuizly-primary text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">{t('footer.instagram')}</span>
                <div className="absolute inset-0 -m-2 bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
              </a>
              <div className="w-px h-4 bg-border/50"></div>
              <a 
                href="https://linkedin.com/company/cuizly"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-cuizly-neutral hover:text-cuizly-primary text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">LinkedIn</span>
                <div className="absolute inset-0 -m-2 bg-gradient-to-r from-cuizly-primary/5 to-cuizly-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100"></div>
              </a>
            </div>
            
            <div className="flex items-center space-x-2 text-cuizly-neutral/80 text-xs sm:text-sm">
              <span>© 2025</span>
              <span className="font-medium">Cuizly Technologies</span>
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