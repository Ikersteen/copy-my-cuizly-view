import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Users, Star } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="w-full bg-gradient-quebec backdrop-blur-sm border-b border-cuizly-primary/20 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Enhanced */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-cuizly-accent rounded-full flex items-center justify-center shadow-card">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cuizly-secondary rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="text-xl font-bold text-white">Cuizly</span>
              <div className="flex items-center space-x-1 text-xs text-white/80">
                <MapPin className="h-3 w-3" />
                <span>Montréal</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#restaurants" className="text-white/90 hover:text-white transition-colors font-medium flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>Restaurants</span>
            </a>
            <a href="#tarifs" className="text-white/90 hover:text-white transition-colors font-medium">
              Tarifs
            </a>
            <a href="#mission" className="text-white/90 hover:text-white transition-colors font-medium flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>À propos</span>
            </a>
            <a href="#contact" className="text-white/90 hover:text-white transition-colors font-medium">
              Contact
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              Connexion
            </Button>
            <Button className="bg-cuizly-accent hover:bg-cuizly-accent/90 text-white shadow-card">
              Commencer
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-cuizly-primary border-t border-white/20">
          <nav className="px-4 py-4 space-y-3">
            <a href="#restaurants" className="block text-white/90 hover:text-white font-medium py-2 flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Restaurants</span>
            </a>
            <a href="#tarifs" className="block text-white/90 hover:text-white font-medium py-2">
              Tarifs
            </a>
            <a href="#mission" className="block text-white/90 hover:text-white font-medium py-2 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>À propos</span>
            </a>
            <a href="#contact" className="block text-white/90 hover:text-white font-medium py-2">
              Contact
            </a>
            <div className="pt-3 border-t border-white/20 space-y-2">
              <Button variant="ghost" className="w-full text-white hover:bg-white/10 justify-start">
                Connexion
              </Button>
              <Button className="w-full bg-cuizly-accent hover:bg-cuizly-accent/90 text-white">
                Commencer
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;