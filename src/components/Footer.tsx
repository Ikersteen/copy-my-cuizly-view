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
                >
                  Fonctionnalités
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
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
                >
                  Contact
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
                  to="/legal" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Légal
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
                >
                  Confidentialité
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Conditions
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/mentions" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Mentions légales
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="relative text-cuizly-neutral hover:text-foreground text-xs sm:text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Cookies
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-cuizly-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative border-t border-border/30 mt-8 sm:mt-12 pt-8 sm:pt-10">
          {/* Decorative line with gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-cuizly-primary/40 to-transparent"></div>
          
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-cuizly-primary to-cuizly-accent rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                <span className="text-background font-bold text-sm sm:text-base">C</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cuizly-primary to-cuizly-accent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <span className="font-bold text-foreground text-lg sm:text-xl tracking-tight transition-all duration-300 group-hover:text-cuizly-primary">Cuizly</span>
            </div>
            
            <p className="text-cuizly-neutral text-sm sm:text-base italic text-center max-w-md leading-relaxed">
              Ton prochain coup de cœur culinaire en un swipe
            </p>
            
            {/* Enhanced Social Links */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <a 
                href="https://www.instagram.com/cuizly?igsh=MXB4MXRuN3hkM2o4dg%3D%3D&utm_source=qr"
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
              <span className="font-medium">Cuizly Technologies Inc.</span>
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