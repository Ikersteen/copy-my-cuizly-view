import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useReservations } from "@/hooks/useReservations";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fr } from "date-fns/locale";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  openingHours?: any;
}

export const ReservationModal = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  openingHours,
}: ReservationModalProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useUserProfile();
  const { createReservation } = useReservations(user?.id);
  
  const [date, setDate] = useState<Date>();
  const [partySize, setPartySize] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Calculer l'heure d'ouverture par défaut basée sur le jour actuel
  const getDefaultTime = () => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[now.getDay()];
    
    if (openingHours && openingHours[dayName] && !openingHours[dayName].closed) {
      return openingHours[dayName].open;
    }
    
    return "12:00";
  };

  const [time, setTime] = useState(getDefaultTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !user?.id) return;

    try {
      await createReservation.mutateAsync({
        restaurant_id: restaurantId,
        user_id: user.id,
        reservation_date: date.toISOString().split("T")[0],
        reservation_time: time,
        party_size: parseInt(partySize),
        customer_name: name,
        customer_email: email,
        customer_phone: phone || undefined,
        special_requests: specialRequests || undefined,
      });

      toast.success(t("reservation.success"), {
        description: t("reservation.successMessage"),
      });
      onClose();
    } catch (error) {
      toast.error(t("reservation.error"), {
        description: t("reservation.errorMessage"),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("reservation.title", { restaurantName })}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Label className="mb-2 block text-center w-full">{t("reservation.date")}</Label>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border pointer-events-auto"
                locale={i18n.language === 'fr' ? fr : undefined}
              />
            </div>

            <div>
              <Label htmlFor="time">{t("reservation.time")}</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="text-base"
              />
            </div>

            <div>
              <Label htmlFor="partySize">{t("reservation.partySize")}</Label>
              <Input
                id="partySize"
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="name">{t("reservation.fullName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">{t("reservation.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">{t("reservation.phoneOptional")}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="specialRequests">{t("reservation.specialRequests")}</Label>
              <Textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder={t("reservation.specialRequestsPlaceholder")}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("reservation.cancel")}
            </Button>
            <Button type="submit" disabled={!date || !time}>
              {t("reservation.confirm")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
