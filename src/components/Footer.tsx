import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-medium text-foreground mb-4">Produit</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-cuizly-neutral hover:text-foreground text-sm">Fonctionnalités</Link></li>
              <li><Link to="/pricing" className="text-cuizly-neutral hover:text-foreground text-sm">Tarifs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-cuizly-neutral hover:text-foreground text-sm">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-4">Entreprise</h3>
            <ul className="space-y-2">
              <li><Link to="/legal" className="text-cuizly-neutral hover:text-foreground text-sm">Légal</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-4">Légal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-cuizly-neutral hover:text-foreground text-sm">Confidentialité</Link></li>
              <li><Link to="/terms" className="text-cuizly-neutral hover:text-foreground text-sm">Conditions</Link></li>
              <li><Link to="/mentions" className="text-cuizly-neutral hover:text-foreground text-sm">Mentions légales</Link></li>
              <li><Link to="/cookies" className="text-cuizly-neutral hover:text-foreground text-sm">Cookies</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                <span className="text-background font-semibold text-xs">C</span>
              </div>
              <span className="font-semibold text-foreground">Cuizly</span>
            </div>
            <p className="text-cuizly-neutral text-sm italic">
              Ton prochain coup de cœur culinaire en un swipe
            </p>
            <p className="text-cuizly-neutral text-xs">
              © 2024 Cuizly Technologie Inc. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;