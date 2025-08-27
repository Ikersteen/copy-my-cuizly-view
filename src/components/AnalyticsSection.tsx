import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Eye, Star, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsSectionProps {
  restaurantId?: string;
}

interface AnalyticsData {
  totalOffers: number;
  activeOffers: number;
  totalMenus: number;
  activeMenus: number;
  profileViews: number;
  menuViews: number;
  avgRating: number;
  totalRatings: number;
  offerClicks: number;
}

export const AnalyticsSection = ({ restaurantId }: AnalyticsSectionProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOffers: 0,
    activeOffers: 0,
    totalMenus: 0,
    activeMenus: 0,
    profileViews: 0,
    menuViews: 0,
    avgRating: 0,
    totalRatings: 0,
    offerClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();

    // Set up real-time subscriptions for all relevant tables
    const analyticsSubscription = supabase
      .channel('restaurant-analytics')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'restaurant_analytics',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        loadAnalytics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ratings',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        loadAnalytics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'offers',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        loadAnalytics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'menus',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        loadAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(analyticsSubscription);
    };
  }, [restaurantId]);

  const loadAnalytics = async () => {
    if (!restaurantId) return;

    try {
      // Get offers data
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('id, is_active')
        .eq('restaurant_id', restaurantId);

      if (offersError) throw offersError;

      // Get menus data
      const { data: menusData, error: menusError } = await supabase
        .from('menus')
        .select('id, is_active')
        .eq('restaurant_id', restaurantId);

      if (menusError) throw menusError;

      // Get real analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('restaurant_analytics')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('date', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Get ratings data
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('restaurant_id', restaurantId);

      if (ratingsError) throw ratingsError;

      // Calculate real analytics
      const totalOffers = offersData?.length || 0;
      const activeOffers = offersData?.filter(offer => offer.is_active).length || 0;
      const totalMenus = menusData?.length || 0;
      const activeMenus = menusData?.filter(menu => menu.is_active).length || 0;

      // Sum up all analytics data
      const profileViews = analyticsData?.reduce((sum, day) => sum + (day.profile_views || 0), 0) || 0;
      const menuViews = analyticsData?.reduce((sum, day) => sum + (day.menu_views || 0), 0) || 0;
      const offerClicks = analyticsData?.reduce((sum, day) => sum + (day.offer_clicks || 0), 0) || 0;

      // Calculate average rating
      const totalRatings = ratingsData?.length || 0;
      const avgRating = totalRatings > 0 
        ? ratingsData.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
        : 0;

      setAnalytics({
        totalOffers,
        activeOffers,
        totalMenus,
        activeMenus,
        profileViews,
        menuViews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings,
        offerClicks,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyticsCards = [
    {
      title: "Offres totales",
      value: analytics.totalOffers,
      icon: TrendingUp,
      color: "text-blue-500",
      description: `${analytics.activeOffers} actives`
    },
    {
      title: "Menus ajoutés",
      value: analytics.totalMenus,
      icon: Calendar,
      color: "text-green-500",
      description: `${analytics.activeMenus} actifs`
    },
    {
      title: "Vues du profil",
      value: analytics.profileViews,
      icon: Eye,
      color: "text-purple-500",
      description: "Vues totales"
    },
    {
      title: "Note moyenne",
      value: analytics.avgRating.toFixed(1),
      icon: Star,
      color: "text-yellow-500",
      description: "Sur 5 étoiles"
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Tableau de performance en temps réel</CardTitle>
        <CardDescription className="text-sm">
          Aperçus sur les performances par segment (Mise à jour en temps réel)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsCards.map((card, index) => (
            <div key={index} className="text-center p-4 bg-cuizly-surface rounded-lg border border-border/50">
              <div className="flex items-center justify-center mb-2">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {card.value}
              </div>
              <div className="text-xs font-medium text-cuizly-neutral mb-1">
                {card.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {card.description}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-cuizly-primary/10 to-cuizly-accent/10 rounded-lg border border-cuizly-primary/20">
          <div className="flex flex-col items-center space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="text-center md:text-left">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Tendances cette semaine 📈
              </h4>
              <p className="text-xs text-cuizly-neutral">
                +15% de vues par rapport à la semaine dernière
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              Tendance positive
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};