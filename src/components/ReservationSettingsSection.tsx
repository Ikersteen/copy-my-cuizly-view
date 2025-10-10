import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReservationSettingsSectionProps {
  restaurantId: string;
}

export const ReservationSettingsSection = ({ restaurantId }: ReservationSettingsSectionProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant-reservation-settings", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("reservations_enabled")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateReservationSettings = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("restaurants")
        .update({ reservations_enabled: enabled })
        .eq("id", restaurantId);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-reservation-settings", restaurantId] });
      toast.success(
        enabled ? t("reservation.reservationsEnabled") : t("reservation.reservationsDisabled")
      );
    },
    onError: () => {
      toast.error(t("reservation.error"));
    },
  });

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">{t("reservation.reservationSettings")}</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t("reservation.reservationSettings")}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t("reservation.reservationSettingsDesc")}</p>
      <div className="flex items-center justify-between">
        <Label htmlFor="reservations-toggle" className="cursor-pointer">
          {restaurant?.reservations_enabled 
            ? t("reservation.disableReservations")
            : t("reservation.enableReservations")}
        </Label>
        <Switch
          id="reservations-toggle"
          checked={restaurant?.reservations_enabled || false}
          onCheckedChange={(checked) => updateReservationSettings.mutate(checked)}
          disabled={updateReservationSettings.isPending}
        />
      </div>
    </div>
  );
};
