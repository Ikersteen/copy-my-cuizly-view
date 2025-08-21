import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="font-medium text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Produit</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/features" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Fonctionnalités</Link></li>
              <li><Link to="/pricing" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Tarifs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/contact" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Entreprise</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/legal" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Légal</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Légal</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/privacy" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Confidentialité</Link></li>
              <li><Link to="/terms" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Conditions</Link></li>
              <li><Link to="/mentions" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Mentions légales</Link></li>
              <li><Link to="/cookies" className="text-cuizly-neutral hover:text-foreground text-xs sm:text-sm">Cookies</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-foreground rounded-full flex items-center justify-center">
                <span className="text-background font-semibold text-xs">C</span>
              </div>
              <span className="font-semibold text-foreground text-sm sm:text-base">Cuizly</span>
            </div>
            <p className="text-cuizly-neutral text-xs sm:text-sm italic text-center">
              Ton prochain coup de cœur culinaire en un swipe
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <a 
                href="https://www.instagram.com/cuizly?igsh=MXB4MXRuN3hkM2o4dg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cuizly-neutral hover:text-foreground transition-colors"
              >
                <span className="text-xs sm:text-sm">Instagram</span>
              </a>
              <a 
                href="https://www.linkedin.com/company/cuizly"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cuizly-neutral hover:text-foreground transition-colors"
              >
                <span className="text-xs sm:text-sm">LinkedIn</span>
              </a>
            </div>
            
            <p className="text-cuizly-neutral text-xs text-center">
              © 2025 Cuizly Technologie Inc. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;