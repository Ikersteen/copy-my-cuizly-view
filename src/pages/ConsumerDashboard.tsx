import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Heart, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
        .limit(6);

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
      price: "$$"
    },
    {
      id: 2,
      restaurant: "Ramen House",
      offer: "Plat + boisson à 15$",
      cuisine: "Japonaise",
      rating: 4.6,
      time: "15-25 min", 
      price: "$"
    },
    {
      id: 3,
      restaurant: "Bistro du Coin",
      offer: "Menu du midi dès 12$",
      cuisine: "Québécoise",
      rating: 4.7,
      time: "20-30 min",
      price: "$$"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-cuizly-primary rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-cuizly-neutral">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-cuizly-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bonjour ! 👋
              </h1>
              <p className="text-cuizly-neutral">Découvrez les meilleures offres du jour</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <Search className="h-5 w-5" />
            <span className="text-xs">Rechercher</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <Filter className="h-5 w-5" />
            <span className="text-xs">Filtrer</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <Heart className="h-5 w-5" />
            <span className="text-xs">Favoris</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <Clock className="h-5 w-5" />
            <span className="text-xs">Historique</span>
          </Button>
        </div>

        {/* Offers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Offres du moment 🔥
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockOffers.map((offer) => (
              <Card key={offer.id} className="bg-background/60 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-all duration-200">
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

        {/* Restaurants Section */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Restaurants partenaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="bg-background/60 backdrop-blur-sm border-0 shadow-card hover:shadow-elevated transition-all duration-200">
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
    </div>
  );
};

export default ConsumerDashboard;