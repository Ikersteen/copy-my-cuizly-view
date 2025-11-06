// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Users, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useLocalizedRoute } from "@/lib/routeTranslations";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface Reservation {
  id: string;
  restaurant_id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  special_requests?: string;
  cancellation_reason?: string;
  created_at: string;
  restaurants?: {
    name: string;
    address: string;
    phone: string;
  };
}

const ConsumerReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dashboardRoute = useLocalizedRoute('/dashboard');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          restaurants (
            name,
            address,
            phone
          )
        `)
        .eq('user_id', user.id)
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast({
        title: t('common.error'),
        description: t('reservation.errorLoading'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(dashboardRoute)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('navigation.backToDashboard')}
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">
            {t('reservation.myReservations')}
          </h1>
          <p className="text-muted-foreground">
            {t('reservation.viewAllReservations')}
          </p>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {t('reservation.noReservations')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {reservation.restaurants?.name}
                      </CardTitle>
                      <CardDescription>
                        {reservation.restaurants?.address}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(reservation.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(reservation.status)}
                        {t(`reservation.status.${reservation.status}`)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(
                          new Date(reservation.reservation_date), 
                          'PPP',
                          { locale: i18n.language === 'fr' ? fr : enUS }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.reservation_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {reservation.party_size} {t('reservation.guests')}
                      </span>
                    </div>
                  </div>

                  {reservation.special_requests && (
                    <div className="pt-2 border-t">
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">{t('reservation.specialRequests')}:</p>
                          <p className="text-muted-foreground">{reservation.special_requests}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {reservation.cancellation_reason && reservation.status === 'cancelled' && (
                    <div className="pt-2 border-t">
                      <div className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">{t('reservation.cancellationReason')}:</p>
                          <p className="text-muted-foreground">{reservation.cancellation_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {t('reservation.phone')}: {reservation.restaurants?.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerReservations;
