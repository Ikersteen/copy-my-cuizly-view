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
  totalViews: number;
  avgRating: number;
}

export const AnalyticsSection = ({ restaurantId }: AnalyticsSectionProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOffers: 0,
    activeOffers: 0,
    totalMenus: 0,
    activeMenus: 0,
    totalViews: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      loadAnalytics();
    }
  }, [restaurantId]);

  const loadAnalytics = async () => {
    if (!restaurantId) return;
    
    try {
      // Charger les statistiques des offres
      const { data: offersData } = await supabase
        .from('offers')
        .select('id, is_active')
        .eq('restaurant_id', restaurantId);

      // Charger les statistiques des menus
      const { data: menusData } = await supabase
        .from('menus')
        .select('id, is_active')
        .eq('restaurant_id', restaurantId);

      // Simuler des données analytiques (en attendant l'implémentation complète)
      const totalOffers = offersData?.length || 0;
      const activeOffers = offersData?.filter(o => o.is_active).length || 0;
      const totalMenus = menusData?.length || 0;
      const activeMenus = menusData?.filter(m => m.is_active).length || 0;
      
      setAnalytics({
        totalOffers,
        activeOffers,
        totalMenus,
        activeMenus,
        totalViews: Math.floor(Math.random() * 500) + 100, // Simulation
        avgRating: 4.2 + (Math.random() * 0.6) // Simulation entre 4.2 et 4.8
      });
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
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
      value: analytics.totalViews,
      icon: Eye,
      color: "text-purple-500",
      description: "Ce mois-ci"
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
          Aperçus sur les performances par segment
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
          <div className="flex items-center justify-between">
            <div>
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