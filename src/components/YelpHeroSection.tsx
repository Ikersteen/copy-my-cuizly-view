import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const YelpHeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("Montréal, QC");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to search results or dashboard
    navigate('/dashboard');
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 sm:py-12 lg:py-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            <span className="block text-primary">{t('hero.title.discover', 'Découvrez')}</span>
            <span className="block">les meilleurs restaurants</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-normal">
              près de chez vous
            </span>
          </h1>
        </div>

        {/* Search form */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl border border-border/10 p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              {/* Restaurant search */}
              <div className="flex-1 flex items-center px-4 py-3 sm:py-4 border-b sm:border-b-0 sm:border-r border-border/20">
                <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Restaurant, cuisine, plat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 p-0 text-base font-medium placeholder:text-muted-foreground bg-transparent focus-visible:ring-0"
                />
              </div>

              {/* Location search */}
              <div className="flex-1 flex items-center px-4 py-3 sm:py-4">
                <MapPin className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Adresse, quartier, ville"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-0 p-0 text-base font-medium placeholder:text-muted-foreground bg-transparent focus-visible:ring-0"
                />
              </div>

              {/* Search button */}
              <div className="sm:flex-shrink-0">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-l-none sm:rounded-r-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Quick suggestions */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Suggestions populaires:</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {["Pizza", "Sushi", "Italien", "Brunch", "Livraison", "Terrasse"].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="rounded-full bg-white/80 hover:bg-primary hover:text-primary-foreground border border-border/30 text-sm px-4 py-2"
                onClick={() => setSearchTerm(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
          <div className="bg-white/60 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">2K+</div>
            <div className="text-sm text-muted-foreground">Restaurants</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">15K+</div>
            <div className="text-sm text-muted-foreground">Avis</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary mb-1">
              <Star className="h-6 w-6 fill-current mr-1" />
              4.8
            </div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">50+</div>
            <div className="text-sm text-muted-foreground">Quartiers</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default YelpHeroSection;