import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Eye, Star, Calendar, MapPin, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

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
  weeklyGrowth?: number;
}

interface PreviousData {
  totalOffers: number;
  activeOffers: number;
  totalMenus: number;
  activeMenus: number;
  profileViews: number;
  avgRating: number;
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
  const [changedCards, setChangedCards] = useState<Set<number>>(new Set());
  const [trends, setTrends] = useState<{[key: string]: 'up' | 'down' | 'stable'}>({});
  const previousData = useRef<PreviousData>({
    totalOffers: 0,
    activeOffers: 0,
    totalMenus: 0,
    activeMenus: 0,
    profileViews: 0,
    avgRating: 0,
  });
  const { t } = useTranslation();

  useEffect(() => {
    if (!restaurantId) return;
    
    loadAnalytics();
    
    // Use polling method directly instead of trying WebSocket first
    console.log('📊 Setting up polling method for analytics');
    const intervalId = setInterval(loadAnalytics, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [restaurantId]);

  const loadAnalytics = async () => {
    if (!restaurantId) return;

    try {
      console.log('Loading analytics for restaurant:', restaurantId);
      
      // Get current week date range for trends calculation
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(currentWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(currentWeekStart);
      lastWeekEnd.setDate(currentWeekStart.getDate() - 1);

      // Get all data in parallel for better performance
      const [offersData, menusData, analyticsData, ratingsData, lastWeekData] = await Promise.all([
        supabase
          .from('offers')
          .select('id, is_active')
          .eq('restaurant_id', restaurantId),
        supabase
          .from('menus')
          .select('id, is_active')
          .eq('restaurant_id', restaurantId),
        supabase
          .from('restaurant_analytics')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date', { ascending: false }),
        supabase
          .from('comments')
          .select('rating')
          .eq('restaurant_id', restaurantId)
          .not('rating', 'is', null),
        supabase
          .from('restaurant_analytics')
          .select('profile_views, menu_views, offer_clicks')
          .eq('restaurant_id', restaurantId)
          .gte('date', lastWeekStart.toISOString().split('T')[0])
          .lte('date', lastWeekEnd.toISOString().split('T')[0])
      ]);

      console.log('Raw data retrieved:', {
        offers: offersData.data,
        menus: menusData.data,
        analytics: analyticsData.data,
        ratings: ratingsData.data,
        lastWeek: lastWeekData.data
      });

      if (offersData.error) throw offersData.error;
      if (menusData.error) throw menusData.error;
      if (analyticsData.error) throw analyticsData.error;
      if (ratingsData.error) throw ratingsData.error;
      if (lastWeekData.error) throw lastWeekData.error;

      // Calculate current analytics
      const totalOffers = offersData.data?.length || 0;
      const activeOffers = offersData.data?.filter(offer => offer.is_active).length || 0;
      const totalMenus = menusData.data?.length || 0;
      const activeMenus = menusData.data?.filter(menu => menu.is_active).length || 0;

      // Calculate TOTAL analytics (not just current week)
      const totalProfileViews = analyticsData.data?.reduce((sum, day) => sum + (day.profile_views || 0), 0) || 0;
      const totalMenuViews = analyticsData.data?.reduce((sum, day) => sum + (day.menu_views || 0), 0) || 0;
      const totalOfferClicks = analyticsData.data?.reduce((sum, day) => sum + (day.offer_clicks || 0), 0) || 0;

      // Calculate current week analytics for trends
      const currentWeekData = analyticsData.data?.filter(day => 
        new Date(day.date) >= currentWeekStart
      ) || [];
      
      const currentWeekViews = currentWeekData.reduce((sum, day) => sum + (day.profile_views || 0), 0);

      // Calculate last week analytics for trends
      const lastWeekViews = lastWeekData.data?.reduce((sum, day) => sum + (day.profile_views || 0), 0) || 0;
      
      // Fix weekly growth calculation - handle case when no previous data exists
      let weeklyGrowth = 0;
      if (lastWeekViews > 0) {
        weeklyGrowth = ((currentWeekViews - lastWeekViews) / lastWeekViews * 100);
      } else if (currentWeekViews > 0) {
        // If there's data this week but not last week, show as positive growth
        weeklyGrowth = 100;
      }
      
      // Round to 1 decimal place
      weeklyGrowth = Math.round(weeklyGrowth * 10) / 10;

      // Calculate average rating
      const totalRatings = ratingsData.data?.length || 0;
      const avgRating = totalRatings > 0 
        ? ratingsData.data.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
        : 0;

      console.log('Calculated metrics:', {
        totalProfileViews,
        totalMenuViews,
        avgRating,
        totalRatings,
        currentWeekViews,
        lastWeekViews,
        weeklyGrowth
      });

      const newAnalytics = {
        totalOffers,
        activeOffers,
        totalMenus,
        activeMenus,
        profileViews: totalProfileViews, // Use total instead of current week
        menuViews: totalMenuViews,       // Use total instead of current week
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings,
        offerClicks: totalOfferClicks,   // Use total instead of current week
        weeklyGrowth: weeklyGrowth
      };

      // Detect changes and animate
      const newChangedCards = new Set<number>();
      const newTrends: {[key: string]: 'up' | 'down' | 'stable'} = {};

      if (!loading) {
        // Check for changes in key metrics
        const metricsToCheck = [
          { key: 'totalOffers', value: totalOffers, prev: previousData.current.totalOffers },
          { key: 'activeOffers', value: activeOffers, prev: previousData.current.activeOffers },
          { key: 'totalMenus', value: totalMenus, prev: previousData.current.totalMenus },
          { key: 'activeMenus', value: activeMenus, prev: previousData.current.activeMenus },
          { key: 'profileViews', value: totalProfileViews, prev: previousData.current.profileViews },
          { key: 'avgRating', value: newAnalytics.avgRating, prev: previousData.current.avgRating },
        ];

        metricsToCheck.forEach((metric, index) => {
          if (metric.value !== metric.prev) {
            newChangedCards.add(index);
            if (metric.value > metric.prev) {
              newTrends[metric.key] = 'up';
            } else if (metric.value < metric.prev) {
              newTrends[metric.key] = 'down';
            } else {
              newTrends[metric.key] = 'stable';
            }
          }
        });

        setChangedCards(newChangedCards);
        setTrends(newTrends);

        // Clear animation after delay
        if (newChangedCards.size > 0) {
          setTimeout(() => {
            setChangedCards(new Set());
          }, 2000);
        }
      }

      // Update previous data for next comparison
      previousData.current = {
        totalOffers,
        activeOffers,
        totalMenus,
        activeMenus,
        profileViews: totalProfileViews,
        avgRating: newAnalytics.avgRating,
      };

      setAnalytics(newAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyticsCards = [
    {
      title: t('analytics.totalOffers'),
      value: analytics.totalOffers,
      subtitle: `${analytics.activeOffers} ${t('analytics.activeOffers')}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-100",
      borderColor: "border-blue-300 dark:border-blue-300",
      trendKey: 'totalOffers'
    },
    {
      title: t('analytics.menusAdded'),
      value: analytics.totalMenus,
      subtitle: `${analytics.activeMenus} ${t('analytics.activeMenus')}`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-100",
      borderColor: "border-green-300 dark:border-green-300",
      trendKey: 'totalMenus'
    },
    {
      title: t('analytics.profileViews'),
      value: analytics.profileViews,
      subtitle: t('analytics.totalViews'),
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-100",
      borderColor: "border-purple-300 dark:border-purple-300",
      trendKey: 'profileViews'
    },
    {
      title: t('analytics.avgRating'),
      value: analytics.avgRating.toFixed(1),
      subtitle: t('analytics.outOfFive'),
      icon: Star,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-100",
      borderColor: "border-orange-300 dark:border-orange-300",
      trendKey: 'avgRating'
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
        <CardTitle className="text-lg sm:text-xl">{t('analytics.title')}</CardTitle>
        <CardDescription className="text-sm">
          {t('analytics.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsCards.map((card, index) => {
            return (
              <div 
                key={index} 
                className={`
                  text-center p-4 rounded-lg border
                  ${card.bgColor} ${card.borderColor}
                `}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className={`p-2 rounded-full ${card.bgColor} border ${card.borderColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                
                <div className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-900">
                  {card.value}
                </div>
                
                <div className="text-xs font-medium text-gray-700 dark:text-gray-700 mb-1">
                  {card.title}
                </div>
                
                <div className="text-xs text-gray-600 dark:text-gray-600">
                  {card.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-50 dark:to-gray-100 rounded-lg border border-gray-200 dark:border-gray-200">
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:justify-between">
            <div className="text-center md:text-left order-2 md:order-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-900">
                  {t('analytics.weeklyTrends')}
                </h4>
                {analytics.weeklyGrowth !== undefined && analytics.weeklyGrowth > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : analytics.weeklyGrowth !== undefined && analytics.weeklyGrowth < 0 ? (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                ) : analytics.weeklyGrowth !== undefined && analytics.weeklyGrowth === 0 ? (
                  <div className="h-4 w-4 bg-gray-400 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-gray-600 rounded-full" />
                  </div>
                ) : (
                  <div className="h-4 w-4 bg-gray-300 rounded-full" />
                )}
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-700">
                {analytics.weeklyGrowth !== undefined ? (
                  analytics.weeklyGrowth > 0 ? 
                    `+${analytics.weeklyGrowth}% ${t('analytics.positiveGrowth')}` :
                  analytics.weeklyGrowth < 0 ?
                    `${analytics.weeklyGrowth}% ${t('analytics.positiveGrowth')}` :
                    t('analytics.noChange')
                ) : (
                  t('analytics.collectingData')
                )}
              </p>
            </div>
            <div className="flex justify-center order-1 md:order-2">
              <Badge 
                variant="outline" 
                className={`
                  ${analytics.weeklyGrowth !== undefined && analytics.weeklyGrowth > 0
                    ? 'text-green-600 border-green-300 bg-green-50'
                    : analytics.weeklyGrowth !== undefined && analytics.weeklyGrowth < 0
                    ? 'text-red-600 border-red-300 bg-red-50'
                    : analytics.weeklyGrowth !== undefined && analytics.weeklyGrowth === 0
                    ? 'text-orange-600 border-orange-300 bg-orange-50'
                    : 'text-blue-600 border-blue-300 bg-blue-50'
                  }
                `}
              >
                {analytics.weeklyGrowth !== undefined ? (
                  analytics.weeklyGrowth > 0 ? t('analytics.positiveTrend') : 
                  analytics.weeklyGrowth < 0 ? t('analytics.negativeTrend') :
                  t('analytics.stable')
                ) : (
                  t('analytics.dataCollection')
                )}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};