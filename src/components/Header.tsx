import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@supabase/supabase-js";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <header className="w-full bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center py-2">
            <img 
              src="/lovable-uploads/db9c9936-605a-4c88-aa46-6154a944bb5c.png" 
              alt="Cuizly" 
              className="h-[50px] w-auto"
            />
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-12">
            <Link to="/pricing" className="text-cuizly-neutral hover:text-foreground transition-colors text-base font-medium px-3 py-2">
              Tarifs
            </Link>
            <Link to="/features" className="text-cuizly-neutral hover:text-foreground transition-colors text-base font-medium px-3 py-2">
              Fonctionnalités
            </Link>
            <Link to="/contact" className="text-cuizly-neutral hover:text-foreground transition-colors text-base font-medium px-3 py-2">
              Contact
            </Link>
          </nav>

          {/* Auth Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link 
                    to="/pricing" 
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border"
                  >
                    Tarifs
                  </Link>
                  <Link 
                    to="/features" 
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border"
                  >
                    Fonctionnalités
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-lg text-foreground hover:text-cuizly-accent transition-colors py-2 border-b border-border"
                  >
                    Contact
                  </Link>
                  
                  <div className="pt-4">
                    {user ? (
                      <Link to="/dashboard" className="block">
                        <Button variant="ghost" className="w-full justify-start text-lg">
                          Tableau de bord
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/auth" className="block">
                        <Button className="w-full bg-foreground hover:bg-foreground/90 text-background text-lg">
                          Se connecter
                        </Button>
                      </Link>
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