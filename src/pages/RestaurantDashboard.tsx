import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Users, DollarSign, Clock, Plus, Edit3, Eye, 
  Settings, Star, MapPin, ChefHat, ShoppingBag, BarChart3 
} from "lucide-react";
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
          .maybeSingle();

        if (!error && data) {
          setRestaurant(data);
        } else if (error) {
          console.error('Erreur lors du chargement du restaurant:', error);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary rounded-xl animate-pulse mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header minimaliste */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-lg">
                  {restaurant?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {restaurant?.name || 'Mon Restaurant'} 👨‍🍳
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gérez votre restaurant efficacement
                </p>
                {restaurant?.address && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 self-start sm:self-auto">
              <Badge 
                variant={restaurant?.is_active ? "default" : "secondary"}
                className={restaurant?.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
              >
                {restaurant?.is_active ? "✅ Actif" : "⏸️ Inactif"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { icon: Plus, label: "Nouvelle offre", primary: true },
            { icon: Edit3, label: "Modifier profil" },
            { icon: ShoppingBag, label: "Ajouter plat" },
            { icon: BarChart3, label: "Statistiques" },
            { icon: Settings, label: "Paramètres" },
            { icon: ChefHat, label: "Menu du jour" }
          ].map((action, index) => (
            <Button 
              key={index}
              variant={action.primary ? "default" : "outline"} 
              className="h-16 sm:h-20 flex flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm"
            >
              <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-xl sm:text-2xl font-semibold text-foreground truncate">{stat.value}</p>
                      <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-primary/10 rounded-lg ml-2 shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Commandes récentes</CardTitle>
                    <CardDescription className="text-sm">
                      Vos dernières commandes et leur statut
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="self-start sm:self-auto">
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        Aucune commande récente
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Les nouvelles commandes apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    recentOrders.map((order, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                            <span className="font-medium text-foreground text-sm sm:text-base">{order.id}</span>
                            <span className="hidden sm:inline text-muted-foreground">•</span>
                            <span className="text-muted-foreground text-sm">{order.client}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.items}</p>
                        </div>
                        <div className="flex items-center justify-between sm:text-right sm:block">
                          <p className="font-medium text-foreground text-sm sm:text-base">{order.amount}</p>
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              order.status === 'Terminé' ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950' :
                              order.status === 'En cours' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950' :
                              'text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Restaurant Info */}
          <div className="space-y-6">
            {restaurant && (
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Informations restaurant</CardTitle>
                  <CardDescription className="text-sm">
                    Détails de votre établissement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Nom</p>
                    <p className="text-foreground text-sm sm:text-base font-medium">{restaurant.name}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Adresse</p>
                    <p className="text-foreground text-sm">{restaurant.address || 'Non renseignée'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Type de cuisine</p>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.cuisine_type?.length > 0 ? (
                        restaurant.cuisine_type.map((cuisine, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cuisine}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Non défini
                        </Badge>
                      )}
                    </div>
                  </div>
                  {restaurant.description && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-foreground text-sm">{restaurant.description}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Statut</span>
                      <Badge variant={restaurant.is_active ? "default" : "secondary"} className="text-xs">
                        {restaurant.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance du mois */}
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
                <CardDescription className="text-sm">
                  Résumé du mois en cours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Note moyenne</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span className="text-sm font-medium">4.{Math.floor(Math.random() * 5) + 3}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Temps de préparation</span>
                  <span className="text-sm font-medium">28 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de satisfaction</span>
                  <span className="text-sm font-medium text-green-600">94%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;