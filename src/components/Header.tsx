import { Button } from "@/components/ui/button";
import { MapPin, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
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
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Ultra minimal */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-cuizly-primary rounded-lg flex items-center justify-center shadow-soft">
              <span className="text-white font-semibold text-sm">C</span>
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">Cuizly</span>
              <div className="flex items-center space-x-1 text-xs text-cuizly-neutral">
                <MapPin className="h-3 w-3" />
                <span>Montréal</span>
              </div>
            </div>
          </Link>

          {/* Navigation - Clean and minimal */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="#restaurants" className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium">
              Restaurants
            </Link>
            <Link to="#pricing" className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium">
              Tarifs
            </Link>
            <Link to="#about" className="text-cuizly-neutral hover:text-foreground transition-colors text-sm font-medium">
              À propos
            </Link>
          </nav>

          {/* Auth Actions - Ultra clean */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Tableau de bord
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="text-sm"
                >
                  Déconnexion
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-sm">
                    <LogIn className="h-4 w-4 mr-1" />
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-cuizly-primary hover:bg-cuizly-primary/90 text-white text-sm">
                    Commencer
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;