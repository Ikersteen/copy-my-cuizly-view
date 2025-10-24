import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, Users, Eye, Clock, Monitor, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsSummary {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  total_page_views: number;
  avg_session_duration: number;
  top_pages: any;
  event_breakdown: any;
  device_breakdown: any;
  browser_breakdown: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SystemAnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Accès refusé - Authentification requise');
        navigate('/');
        return;
      }

      // Vérifier le rôle admin
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roles) {
        toast.error('Accès refusé - Privilèges administrateur requis');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadAnalytics();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Erreur de vérification des privilèges');
      navigate('/');
    }
  };

  const loadAnalytics = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase.rpc('get_analytics_summary', {
        start_date: thirtyDaysAgo.toISOString(),
        end_date: new Date().toISOString(),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        setAnalytics({
          total_events: result.total_events,
          unique_users: result.unique_users,
          unique_sessions: result.unique_sessions,
          total_page_views: result.total_page_views,
          avg_session_duration: result.avg_session_duration,
          top_pages: typeof result.top_pages === 'string' ? JSON.parse(result.top_pages) : result.top_pages,
          event_breakdown: typeof result.event_breakdown === 'string' ? JSON.parse(result.event_breakdown) : result.event_breakdown,
          device_breakdown: typeof result.device_breakdown === 'string' ? JSON.parse(result.device_breakdown) : result.device_breakdown,
          browser_breakdown: typeof result.browser_breakdown === 'string' ? JSON.parse(result.browser_breakdown) : result.browser_breakdown,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erreur de chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !analytics) {
    return null;
  }

  // Préparer les données pour les graphiques
  const eventData = Object.entries(analytics.event_breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const deviceData = Object.entries(analytics.device_breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const browserData = Object.entries(analytics.browser_breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Tableau de bord Analytics</h1>
            <p className="text-muted-foreground mt-2">Derniers 30 jours d'activité</p>
          </div>
          <Activity className="w-12 h-12 text-primary" />
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total d'événements</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_events.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs uniques</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.unique_users.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vues de pages</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_page_views.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durée moy. session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(analytics.avg_session_duration)}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques détaillés */}
        <Tabs defaultValue="pages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pages">Pages populaires</TabsTrigger>
            <TabsTrigger value="events">Types d'événements</TabsTrigger>
            <TabsTrigger value="devices">Appareils</TabsTrigger>
            <TabsTrigger value="browsers">Navigateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 des pages les plus visitées</CardTitle>
                <CardDescription>Pages avec le plus de vues</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.top_pages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="page" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des types d'événements</CardTitle>
                <CardDescription>Distribution des actions utilisateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={eventData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par type d'appareil</CardTitle>
                <CardDescription>Desktop, mobile, tablet</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#82ca9d"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browsers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par navigateur</CardTitle>
                <CardDescription>Navigateurs utilisés par les visiteurs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={browserData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
