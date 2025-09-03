import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";  
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Menu, X, Globe, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

const Header = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleNavigate = (path: string) => {
    setIsSheetOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="w-full px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Extrême gauche */}
          <div className="flex-shrink-0">
            <Link 
              to="/"
              className="flex items-center py-2 cursor-pointer group"
              onClick={() => window.location.href = '/'}
            >
              <img 
                src="/lovable-uploads/9727855b-56d5-4c89-93e2-8d3e2e8eae1e.png" 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 dark:hidden"
              />
              <img 
                src="/lovable-uploads/2ca03ecc-31e6-42ef-89bf-9532213d22eb.png" 
                alt="Cuizly" 
                className="h-[50px] w-auto transition-all duration-300 group-hover:scale-110 hidden dark:block"
              />
            </Link>
          </div>

          {/* Navigation Desktop - Centre */}
          <nav className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
              >
                {t('navigation.pricing')}
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
              >
                {t('navigation.features')}
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium px-2 py-2"
              >
                {t('navigation.contact')}
              </button>
            </div>
          </nav>

          {/* Auth Actions Desktop - Extrême droite */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'bg-accent' : ''}
                >
                  ☀️ {t('theme.light')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'bg-accent' : ''}
                >
                  🌙 {t('theme.dark')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTheme('system')}
                  className={theme === 'system' ? 'bg-accent' : ''}
                >
                  💻 {t('theme.system')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs font-medium">
                    {currentLanguage}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => changeLanguage('fr')}
                  className={currentLanguage === 'fr' ? 'bg-accent' : ''}
                >
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => changeLanguage('en')}
                  className={currentLanguage === 'en' ? 'bg-accent' : ''}
                >
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {user ? (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  {t('navigation.dashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-foreground hover:bg-foreground/90 text-background">
                  {t('navigation.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu - Now shows for tablet and mobile */}
          <div className="lg:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <button 
                    onClick={() => handleNavigate("/pricing")}
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                  >
                    {t('navigation.pricing')}
                  </button>
                  <button 
                    onClick={() => handleNavigate("/features")}
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                  >
                    {t('navigation.features')}
                  </button>
                  <button 
                    onClick={() => handleNavigate("/contact")}
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                  >
                    {t('navigation.contact')}
                  </button>
                  
                  {/* Mobile Theme Selector */}
                  <div className="py-2 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                      {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span className="text-sm font-medium">{t('navigation.theme')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setTheme('light');
                          setIsSheetOpen(false);
                        }}
                      >
                        ☀️
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setTheme('dark');
                          setIsSheetOpen(false);
                        }}
                      >
                        🌙
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setTheme('system');
                          setIsSheetOpen(false);
                        }}
                      >
                        💻
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Language Selector */}
                  <div className="py-2 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">Langue / Language</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={currentLanguage === 'fr' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          changeLanguage('fr');
                          setIsSheetOpen(false);
                        }}
                      >
                        🇫🇷 FR
                      </Button>
                      <Button
                        variant={currentLanguage === 'en' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          changeLanguage('en');
                          setIsSheetOpen(false);
                        }}
                      >
                        🇬🇧 EN
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    {user ? (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-lg"
                        onClick={() => handleNavigate("/dashboard")}
                      >
                        {t('navigation.dashboard')}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-foreground hover:bg-foreground/90 text-background text-lg"
                        onClick={() => handleNavigate("/auth")}
                      >
                        {t('navigation.login')}
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;