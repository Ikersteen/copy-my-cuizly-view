import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocalizedRoute } from '@/lib/routeTranslations';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import { Twitter } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  
  // Get localized routes
  const mentionsRoute = useLocalizedRoute('/mentions');
  const privacyRoute = useLocalizedRoute('/privacy');
  const termsRoute = useLocalizedRoute('/terms');
  
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
        
        <div className="relative mt-8 sm:mt-12 pt-8 sm:pt-10">
          
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <a 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src="/cuizly-logo-colorful.png" 
                alt="Cuizly" 
                className="h-[120px] w-auto transition-all duration-300 group-hover:scale-110"
              />
            </a>
            
            <p className="text-cuizly-neutral text-sm sm:text-base italic text-center max-w-md leading-relaxed">
              {t('footer.tagline')}
            </p>
            
            <div className="text-cuizly-neutral/80 text-xs sm:text-sm">
              <span>© 2025 {t('footer.companyName')} {t('footer.allRightsReserved')}</span>
            </div>

            {/* Social Links (left) and Legal links (right) on same line */}
            <div className="w-full flex justify-between items-center">
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

              <ul className="flex items-center gap-3 text-xs">
                <li>
                  <Link 
                    to={mentionsRoute}
                    className="text-cuizly-neutral hover:text-foreground transition-colors"
                  >
                    Legal
                  </Link>
                </li>
                <li className="text-cuizly-neutral/40">|</li>
                <li>
                  <Link 
                    to={privacyRoute}
                    className="text-cuizly-neutral hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li className="text-cuizly-neutral/40">|</li>
                <li>
                  <Link 
                    to={termsRoute}
                    className="text-cuizly-neutral hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
