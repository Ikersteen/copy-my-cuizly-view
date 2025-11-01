import { Link } from "react-router-dom";  
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Header = () => {
  const { t } = useTranslation();

  // Utilise le nouveau logo (icône)
  const getLogoSrc = () => {
    return "/cuizly-icon-new.png";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Extrême gauche */}
          <div className="flex-shrink-0">
            <a 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img 
                src={getLogoSrc()} 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110"
              />
            </a>
          </div>

          {/* Navigation Desktop - Removed */}

          {/* Assistant Logo + Language */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link 
              to="/cuizlyassistant"
              className="flex items-center group cursor-pointer"
            >
              <img 
                src="/cuizly-assistant-logo.png" 
                alt="Cuizly Assistant" 
                className="h-[35px] w-auto transition-all duration-300 group-hover:opacity-80"
              />
            </Link>
            
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
