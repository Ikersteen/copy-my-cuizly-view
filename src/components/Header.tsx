import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";  
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Header = () => {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  
  // Get localized routes
  const teamRoute = useLocalizedRoute('/team');
  const termsRoute = useLocalizedRoute('/terms');
  const privacyRoute = useLocalizedRoute('/privacy');
  const cookiesRoute = useLocalizedRoute('/cookies');
  const legalRoute = useLocalizedRoute('/legal');

  // Utilise le nouveau logo (icône)
  const getLogoSrc = () => {
    return "/cuizly-icon-new.png";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
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

          {/* Navigation Desktop - Centre */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-8">
            <Link 
              to={teamRoute}
              className="text-foreground hover:text-cuizly-primary transition-colors font-medium"
            >
              {t('navigation.team')}
            </Link>
            <Link 
              to={legalRoute}
              className="text-foreground hover:text-cuizly-primary transition-colors font-medium"
            >
              {t('navigation.legal')}
            </Link>
            <Link 
              to={privacyRoute}
              className="text-foreground hover:text-cuizly-primary transition-colors font-medium"
            >
              {t('navigation.privacy')}
            </Link>
            <Link 
              to={termsRoute}
              className="text-foreground hover:text-cuizly-primary transition-colors font-medium"
            >
              {t('navigation.terms')}
            </Link>
            <Link 
              to={cookiesRoute}
              className="text-foreground hover:text-cuizly-primary transition-colors font-medium"
            >
              {t('navigation.cookies')}
            </Link>
          </nav>

          {/* Language + Assistant Logo + Mobile Menu */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <LanguageSwitcher />
            
            <Link 
              to="/cuizlyassistant"
              className="hidden sm:flex items-center group cursor-pointer"
            >
              <img 
                src="/cuizly-assistant-logo.png" 
                alt="Cuizly Assistant" 
                className="h-[35px] w-auto transition-all duration-300 group-hover:opacity-80"
              />
            </Link>
            
            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-foreground hover:bg-foreground/90 text-background rounded-full h-9 w-9 p-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background z-50">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Accordion type="single" collapsible className="w-full">
                      {/* Entreprise */}
                      <AccordionItem value="company">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                          {t('navigation.company')}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-2 pl-4">
                            <Link 
                              to={teamRoute} 
                              onClick={() => setIsSheetOpen(false)}
                              className="py-2 hover:text-primary transition-colors"
                            >
                              {t('navigation.team')}
                            </Link>
                            <Link 
                              to={legalRoute} 
                              onClick={() => setIsSheetOpen(false)}
                              className="py-2 hover:text-primary transition-colors"
                            >
                              {t('navigation.legal')}
                            </Link>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Légal */}
                      <AccordionItem value="legal">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                          {t('navigation.legalMenu')}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-2 pl-4">
                            <Link 
                              to={termsRoute} 
                              onClick={() => setIsSheetOpen(false)}
                              className="py-2 hover:text-primary transition-colors"
                            >
                              {t('navigation.terms')}
                            </Link>
                            <Link 
                              to={privacyRoute} 
                              onClick={() => setIsSheetOpen(false)}
                              className="py-2 hover:text-primary transition-colors"
                            >
                              {t('navigation.privacy')}
                            </Link>
                            <Link 
                              to={cookiesRoute} 
                              onClick={() => setIsSheetOpen(false)}
                              className="py-2 hover:text-primary transition-colors"
                            >
                              {t('navigation.cookies')}
                            </Link>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
