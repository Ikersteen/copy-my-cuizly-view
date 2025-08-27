import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";  
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@supabase/supabase-js";

const Header = () => {
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
            <a href="https://www.cuizly.ca" className="flex items-center py-2">
              <img 
                src="/lovable-uploads/db9c9936-605a-4c88-aa46-6154a944bb5c.png" 
                alt="Cuizly" 
                className="h-[50px] w-auto"
              />
            </a>
          </div>

          {/* Navigation Desktop - Centre */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-12">
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-cuizly-neutral hover:text-foreground transition-colors text-base font-medium px-3 py-2"
              >
                Tarifs
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-cuizly-neutral hover:text-foreground transition-colors text-base font-medium px-3 py-2"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-cuizly-neutral hover:text-foreground transition-colors text-base font-medium px-3 py-2"
              >
                Contact
              </button>
            </div>
          </nav>

          {/* Auth Actions Desktop - Extrême droite */}
          <div className="hidden md:flex items-center flex-shrink-0">
            {user ? (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Tableau de bord
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-foreground hover:bg-foreground/90 text-background">
                  Se connecter
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
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
                    Tarifs
                  </button>
                  <button 
                    onClick={() => handleNavigate("/features")}
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                  >
                    Fonctionnalités
                  </button>
                  <button 
                    onClick={() => handleNavigate("/contact")}
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border text-left"
                  >
                    Contact
                  </button>
                  
                  <div className="pt-4">
                    {user ? (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-lg"
                        onClick={() => handleNavigate("/dashboard")}
                      >
                        Tableau de bord
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-foreground hover:bg-foreground/90 text-background text-lg"
                        onClick={() => handleNavigate("/auth")}
                      >
                        Se connecter
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