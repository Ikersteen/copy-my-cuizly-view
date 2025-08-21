import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, Clock, Star, Heart, Search, Filter, Settings, 
  TrendingUp, Zap, Gift, History, Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { PreferencesModal } from "@/components/PreferencesModal";
import { RecommendationEngine } from "@/components/RecommendationEngine";
import type { User } from "@supabase/supabase-js";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  price_range: string;
}

const ConsumerDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const { preferences, loading: preferencesLoading } = useUserPreferences();

  useEffect(() => {
    // Get user
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    // Get restaurants
    const getRestaurants = async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .limit(8);

      if (!error && data) {
        setRestaurants(data);
      }
      setLoading(false);
    };

    getUser();
    getRestaurants();
  }, []);

  const mockOffers = [
    {
      id: 1,
      restaurant: "Chez Marie",
      offer: "20% sur tous les plats",
      cuisine: "Française",
      rating: 4.8,
      time: "25-35 min",
      price: "$$",
      trending: true
    },
    {
      id: 2,
      restaurant: "Ramen House",
      offer: "Plat + boisson à 15$",
      cuisine: "Japonaise", 
      rating: 4.6,
      time: "15-25 min",
      price: "$",
      hot: true
    },
    {
      id: 3,
      restaurant: "Bistro du Coin",
      offer: "Menu du midi dès 12$",
      cuisine: "Québécoise",
      rating: 4.7,
      time: "20-30 min",
      price: "$$",
      limited: true
    }
  ];

  if (loading || preferencesLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl animate-pulse mx-auto shadow-glow"></div>
          <p className="text-cuizly-neutral animate-pulse">Chargement de votre expérience personnalisée...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header personnalisé */}
        <div className="relative">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cuizly-primary/20 to-cuizly-secondary/10"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Bonjour ! 👋
                    </h1>
                    <p className="text-white/80 text-lg">
                      Prêt pour votre prochaine découverte culinaire ?
                    </p>
                    {preferences?.cuisine_preferences?.length && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-white/70">Vos goûts:</span>
                        <div className="flex gap-1">
                          {preferences.cuisine_preferences.slice(0, 3).map(cuisine => (
                            <Badge key={cuisine} className="bg-white/20 text-white border-white/30 text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="secondary"
                  onClick={() => setShowPreferences(true)}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche améliorée */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cuizly-neutral h-5 w-5" />
                <Input 
                  placeholder="Rechercher un restaurant, un plat, une cuisine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-0 bg-cuizly-surface/50 focus:bg-white transition-all duration-200"
                />
              </div>
              <Button size="lg" className="bg-cuizly-primary hover:bg-cuizly-primary/90">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides avec nouvelles fonctionnalités */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: TrendingUp, label: "Tendances", color: "cuizly-accent" },
            { icon: Zap, label: "Livraison rapide", color: "cuizly-warning" },
            { icon: Gift, label: "Promotions", color: "cuizly-success" },
            { icon: Heart, label: "Favoris", color: "cuizly-accent" },
            { icon: History, label: "Historique", color: "cuizly-neutral" },
            { icon: Filter, label: "Filtres", color: "cuizly-secondary" }
          ].map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              className="h-20 flex flex-col space-y-2 hover:shadow-soft transition-all duration-200 hover:scale-105 bg-white/50 backdrop-blur-sm"
            >
              <action.icon className={`h-5 w-5 text-${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Système de recommandations IA */}
        <RecommendationEngine preferences={preferences} />

        {/* Offres du moment améliorées */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-cuizly-warning" />
              Offres du moment
            </h2>
            <Button variant="ghost" size="sm">
              Voir toutes
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockOffers.map((offer) => (
              <Card 
                key={offer.id} 
                className="bg-gradient-card backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-105 group relative overflow-hidden"
              >
                {/* Badges de statut */}
                {offer.trending && (
                  <Badge className="absolute top-3 right-3 bg-cuizly-accent text-white z-10">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Tendance
                  </Badge>
                )}
                {offer.hot && (
                  <Badge className="absolute top-3 right-3 bg-cuizly-warning text-white z-10">
                    <Zap className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                )}
                {offer.limited && (
                  <Badge className="absolute top-3 right-3 bg-cuizly-success text-white z-10">
                    <Clock className="h-3 w-3 mr-1" />
                    Limité
                  </Badge>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl group-hover:text-cuizly-primary transition-colors">
                        {offer.restaurant}
                      </CardTitle>
                      <CardDescription className="text-cuizly-primary font-semibold text-lg">
                        {offer.offer}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-cuizly-surface text-lg px-3 py-1">
                      {offer.price}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-cuizly-warning text-cuizly-warning" />
                      <span className="font-semibold">{offer.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-cuizly-neutral">
                      <Clock className="h-4 w-4" />
                      <span>{offer.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`${
                        preferences?.cuisine_preferences?.includes(offer.cuisine)
                          ? 'bg-cuizly-primary/10 text-cuizly-primary border-cuizly-primary/30'
                          : ''
                      }`}
                    >
                      {offer.cuisine}
                    </Badge>
                    <Button 
                      size="sm" 
                      className="bg-cuizly-primary hover:bg-cuizly-primary/90 transition-all duration-200 shadow-soft hover:shadow-elevated"
                    >
                      Commander
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Restaurants partenaires avec amélirations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Tous les restaurants
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {restaurants.length} restaurants
              </Badge>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((restaurant) => (
              <Card 
                key={restaurant.id} 
                className="bg-gradient-card backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-105 group"
              >
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-cuizly-primary transition-colors">
                    {restaurant.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {restaurant.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-1 text-sm text-cuizly-neutral">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{restaurant.address || 'Adresse non disponible'}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine_type?.slice(0, 3).map((cuisine, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`text-xs ${
                          preferences?.cuisine_preferences?.includes(cuisine)
                            ? 'bg-cuizly-primary/10 text-cuizly-primary border-cuizly-primary/30'
                            : ''
                        }`}
                      >
                        {cuisine}
                      </Badge>
                    ))}
                    {restaurant.cuisine_type?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{restaurant.cuisine_type.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {restaurant.price_range}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="hover:bg-cuizly-primary hover:text-white transition-all duration-200"
                    >
                      Voir le menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Modal des préférences */}
      <PreferencesModal 
        open={showPreferences} 
        onOpenChange={setShowPreferences}
      />
    </div>
  );
};

export default ConsumerDashboard;