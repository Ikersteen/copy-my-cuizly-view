import { useReservations } from "@/hooks/useReservations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RestaurantReservationsSectionProps {
  restaurantId: string;
}

export const RestaurantReservationsSection = ({ restaurantId }: RestaurantReservationsSectionProps) => {
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
    await updateReservation.mutateAsync({ id, status: newStatus as any });
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement des réservations...</div>;
  }

  if (!reservations || reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune réservation pour le moment
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Réservations</h2>
      
      <div className="grid gap-4">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{reservation.customer_name}</CardTitle>
                  <Badge className={getStatusColor(reservation.status)}>
                    {getStatusLabel(reservation.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
