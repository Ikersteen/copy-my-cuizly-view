import { useReservations } from "@/hooks/useReservations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface RestaurantReservationsSectionProps {
  restaurantId: string;
}

export const RestaurantReservationsSection = ({ restaurantId }: RestaurantReservationsSectionProps) => {
  const { t } = useTranslation();
  const { reservations, isLoading, updateReservation } = useReservations(undefined, restaurantId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmée";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulée";
      case "completed":
        return "Complétée";
      case "no_show":
        return "Absent";
      default:
        return status;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateReservation.mutateAsync({ id, status: newStatus as any });
      toast.success(t("reservation.statusUpdated"));
    } catch (error) {
      toast.error(t("reservation.updateError"));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">Chargement des réservations...</div>
        </CardContent>
      </Card>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("reservation.reservations")}</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune réservation pour le moment
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("reservation.reservations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{reservation.customer_name}</h3>
                  <Badge className={getStatusColor(reservation.status)}>
                    {getStatusLabel(reservation.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(reservation.reservation_date), "d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.reservation_time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.party_size} personnes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{reservation.customer_email}</span>
                </div>
              </div>

              {reservation.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.customer_phone}</span>
                </div>
              )}

              {reservation.special_requests && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Demandes spéciales:</p>
                  <p className="text-muted-foreground">{reservation.special_requests}</p>
                </div>
              )}

              {reservation.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(reservation.id, "confirmed")}
                  >
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(reservation.id, "cancelled")}
                  >
                    Refuser
                  </Button>
                </div>
              )}

              {reservation.status === "confirmed" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(reservation.id, "completed")}
                  >
                    Marquer comme complétée
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(reservation.id, "no_show")}
                  >
                    Client absent
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
