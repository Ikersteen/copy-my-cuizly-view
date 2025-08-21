import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Clock, Plus, Edit3, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine_type: string[];
  is_active: boolean;
}

const RestaurantDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDataAndRestaurant = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Get user's restaurant
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        if (!error && data) {
          setRestaurant(data);
        }
      }
      setLoading(false);
    };

    getDataAndRestaurant();
  }, []);

  const stats = [
    {
      title: "Vues cette semaine",
      value: "1,247",
      change: "+12%",
      icon: Eye,
      trend: "up"
    },
    {
      title: "Nouvelles commandes",
      value: "43",
      change: "+8%",
      icon: Users,
      trend: "up"
    },
    {
      title: "Revenus du mois",
      value: "2,340$",
      change: "+23%",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Temps moyen",
      value: "28 min",
      change: "-2 min",
      icon: Clock,
      trend: "down"
    }
  ];

  const recentOrders = [
    { id: "#1234", client: "Marie L.", items: "Burger + frites", amount: "18.50$", status: "En cours" },
    { id: "#1235", client: "Jean D.", items: "Pizza Margherita", amount: "22.00$", status: "Terminé" },
    { id: "#1236", client: "Sophie M.", items: "Salade César", amount: "14.00$", status: "Nouveau" },
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cuizly-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold">
                  {restaurant?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {restaurant?.name || 'Mon Restaurant'}
                </h1>
                <p className="text-cuizly-neutral">Tableau de bord restaurateur</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={restaurant?.is_active ? "default" : "secondary"}
                className={restaurant?.is_active ? "bg-green-100 text-green-800" : ""}
              >
                {restaurant?.is_active ? "Actif" : "Inactif"}
              </Badge>
              <Button size="sm" className="bg-cuizly-primary hover:bg-cuizly-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle offre
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-background/60 backdrop-blur-sm border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cuizly-neutral">{stat.title}</p>
                      <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                      <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-3 bg-cuizly-surface rounded-lg">
                      <Icon className="h-5 w-5 text-cuizly-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Commandes récentes</span>
                  <Button variant="outline" size="sm">
                    Voir tout
                  </Button>
                </CardTitle>
                <CardDescription>
                  Vos dernières commandes et leur statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-cuizly-surface rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-medium text-foreground">{order.id}</span>
                          <span className="text-cuizly-neutral">•</span>
                          <span className="text-cuizly-neutral">{order.client}</span>
                        </div>
                        <p className="text-sm text-cuizly-neutral">{order.items}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{order.amount}</p>
                        <Badge 
                          variant="outline"
                          className={
                            order.status === 'Terminé' ? 'text-green-600 border-green-200' :
                            order.status === 'En cours' ? 'text-blue-600 border-blue-200' :
                            'text-orange-600 border-orange-200'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-card">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>
                  Gérez votre restaurant en un clic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Modifier le profil
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un plat
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Voir les statistiques
                </Button>
              </CardContent>
            </Card>

            {/* Restaurant Info */}
            {restaurant && (
              <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-cuizly-neutral">Adresse</p>
                    <p className="text-foreground">{restaurant.address || 'Non renseignée'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-cuizly-neutral">Cuisine</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {restaurant.cuisine_type?.map((cuisine, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;