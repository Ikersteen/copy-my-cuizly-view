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
        
        {/* Header minimaliste */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cuizly-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Bonjour ! 👋
                </h1>
                <p className="text-cuizly-neutral">
                  Découvrez les meilleures offres du jour
                </p>
                {preferences?.cuisine_preferences?.length && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-cuizly-neutral">Vos goûts:</span>
                    <div className="flex gap-1">
                      {preferences.cuisine_preferences.slice(0, 3).map(cuisine => (
                        <Badge key={cuisine} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => setShowPreferences(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Préférences
            </Button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cuizly-neutral h-5 w-5" />
          <Input 
            placeholder="Rechercher un restaurant, un plat, une cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: TrendingUp, label: "Tendances" },
            { icon: Zap, label: "Rapide" },
            { icon: Gift, label: "Promotions" },
            { icon: Heart, label: "Favoris" },
            { icon: History, label: "Historique" },
            { icon: Filter, label: "Filtres" }
          ].map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Système de recommandations IA */}
        <RecommendationEngine preferences={preferences} />

        {/* Offres du moment */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Offres du moment 🔥
            </h2>
            <Button variant="ghost" size="sm">
              Voir toutes
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockOffers.map((offer) => (
              <Card 
                key={offer.id} 
                className="shadow-card hover:shadow-elevated transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{offer.restaurant}</CardTitle>
                      <CardDescription className="text-cuizly-accent font-medium">
                        {offer.offer}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-cuizly-surface">
                      {offer.price}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-cuizly-neutral mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span>{offer.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{offer.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{offer.cuisine}</Badge>
                    <Button size="sm" className="bg-cuizly-primary hover:bg-cuizly-primary/90">
                      Voir l'offre
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Restaurants partenaires */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Restaurants partenaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="shadow-card hover:shadow-elevated transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  <CardDescription>{restaurant.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-1 text-sm text-cuizly-neutral mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.address || 'Adresse non disponible'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {restaurant.cuisine_type?.map((cuisine, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline">
                    Voir le menu
                  </Button>
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