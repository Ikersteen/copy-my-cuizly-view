import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocalizedRoute } from '@/lib/routeTranslations';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import { Twitter } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  
  // Get localized routes
  const teamRoute = useLocalizedRoute('/team');
  const mentionsRoute = useLocalizedRoute('/mentions');
  const privacyRoute = useLocalizedRoute('/privacy');
  const termsRoute = useLocalizedRoute('/terms');
  const cookiesRoute = useLocalizedRoute('/cookies');
  
  return (
    <footer className="relative bg-card overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--cuizly-primary)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-center justify-items-center">
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
        
        <div className="relative mt-8 sm:mt-12 pt-8 sm:pt-10">
          
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <a 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src="/cuizly-logo-new.png" 
                alt="Cuizly" 
                className="h-[100px] w-auto transition-all duration-300 group-hover:scale-110"
              />
            </a>
            
            <p className="text-cuizly-neutral text-sm sm:text-base italic text-center max-w-md leading-relaxed">
              {t('footer.tagline')}
            </p>
            
            <div className="text-cuizly-neutral/80 text-xs sm:text-sm">
              <span>© 2025 {t('footer.companyName')} {t('footer.allRightsReserved')}</span>
            </div>
            
            {/* Social Links - Small and left aligned */}
            <div className="w-full flex justify-start pl-4">
              <div className="flex items-center space-x-4">
                <a 
                  href="https://www.instagram.com/cuizly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cuizly-neutral hover:text-background transition-colors duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://linkedin.com/company/cuizly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cuizly-neutral hover:text-background transition-colors duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.tiktok.com/@cuizly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cuizly-neutral hover:text-background transition-colors duration-300 flex items-center"
                  aria-label="TikTok"
                >
                  <img 
                    src="/lovable-uploads/tiktok-icon.png" 
                    alt="TikTok" 
                    className="w-4 h-4"
                  />
                </a>
                <a 
                  href="https://x.com/cuizly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cuizly-neutral hover:text-background transition-colors duration-300"
                  aria-label="X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a 
                  href="mailto:support@cuizly.ca"
                  className="text-cuizly-neutral hover:text-background transition-colors duration-300"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
