import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingComponent } from '@/components/RatingComponent';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Menu {
  id: string;
  restaurant_id: string;
  description: string;
  cuisine_type?: string;
  image_url: string;
  created_at: string;
  restaurants: {
    id: string;
    name: string;
    description?: string;
    cuisine_type?: string[];
    price_range?: string;
    logo_url?: string;
  };
}

export const AllMenusSection = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch restaurant data separately
      if (data && data.length > 0) {
        const restaurantIds = [...new Set(data.map(menu => menu.restaurant_id))];
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .rpc('get_public_restaurants');

        if (restaurantsError) throw restaurantsError;

        // Combine the data
        const menusWithRestaurants = data.map(menu => ({
          ...menu,
          restaurants: restaurantsData?.find(r => r.id === menu.restaurant_id) || {
            id: menu.restaurant_id,
            name: 'Restaurant inconnu',
            description: '',
            cuisine_type: [],
            price_range: '',
            logo_url: ''
          }
        }));

        setMenus(menusWithRestaurants);
      } else {
        setMenus([]);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les menus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Track menu views for analytics
  const trackMenuView = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_analytics')
        .upsert({
          restaurant_id: restaurantId,
          menu_views: 1,
          date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'restaurant_id,date',
          ignoreDuplicates: false,
        });

      if (error) console.error('Error tracking menu view:', error);
    } catch (error) {
      console.error('Error tracking menu view:', error);
    }
  };

  useEffect(() => {
    fetchMenus();

    // Subscribe to realtime changes in menus table
    const subscription = supabase
      .channel('menus-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menus',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          console.log('Menu change detected:', payload);
          // Refetch menus when there's a change
          fetchMenus();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <h1 className="text-2xl font-bold mb-1">Tous les menus disponibles</h1>
            <p className="text-sm text-muted-foreground">
              Découvrez les délicieux menus proposés par nos restaurants partenaires
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Chargement des menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Tous les menus disponibles</h1>
          <p className="text-sm text-muted-foreground">
            Découvrez les délicieux menus proposés par nos restaurants partenaires
          </p>
        </div>
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Aucun menu disponible pour le moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Revenez bientôt pour découvrir de nouveaux menus !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {menu.restaurants.logo_url && (
                      <img
                        src={menu.restaurants.logo_url}
                        alt={`${menu.restaurants.name} logo`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{menu.restaurants.name}</CardTitle>
                      {menu.restaurants.price_range && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {menu.restaurants.price_range}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Menu Image */}
                <div 
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => trackMenuView(menu.restaurant_id)}
                >
                  <img
                    src={menu.image_url}
                    alt="Menu"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Menu Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {menu.description}
                  </p>
                  
                  {/* Cuisine Types */}
                  {menu.restaurants.cuisine_type && (
                    <div className="flex flex-wrap gap-1">
                      {menu.restaurants.cuisine_type.map((cuisine, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Restaurant Rating */}
                <div className="border-t pt-3">
                  <RatingComponent 
                    restaurantId={menu.restaurant_id} 
                    showAddRating={true}
                  />
                </div>

                <div className="text-xs text-muted-foreground pt-2">
                  Ajouté le {new Date(menu.created_at).toLocaleDateString('fr-CA')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};