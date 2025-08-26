import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-cuizly-surface via-background to-cuizly-surface border-t border-border/50 overflow-hidden">
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
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">Produit</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/features" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Fonctionnalités
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Tarifs
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/contact" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Contactez-nous
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">Entreprise</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/mentions" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Mentions légales
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="group">
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base tracking-wide">Légal</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Politique de confidentialité
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Conditions d'utilisation
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Politique des cookies
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative border-t-2 border-border/60 mt-8 sm:mt-12 pt-8 sm:pt-10">
          {/* Decorative line with solid color */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-cuizly-primary/60"></div>
          
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
              <img 
                src="/lovable-uploads/db9c9936-605a-4c88-aa46-6154a944bb5c.png" 
                alt="Cuizly" 
                className="h-[70px] w-auto transition-all duration-300 group-hover:scale-110"
              />
            </Link>
            
            <p className="text-cuizly-neutral text-sm sm:text-base italic text-center max-w-md leading-relaxed">
              Ton prochain coup de cœur culinaire en un swipe
            </p>
            
            {/* Enhanced Social Links */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <a 
                href="https://www.instagram.com/cuizly"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-cuizly-neutral hover:text-cuizly-primary text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Instagram</span>
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
              <span>Tous droits réservés</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;