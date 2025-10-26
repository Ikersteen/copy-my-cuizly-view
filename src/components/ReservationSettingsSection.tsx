import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
        .select("reservations_enabled, number_of_tables, reservation_turnover_minutes, max_reservation_duration_minutes")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [numberOfTables, setNumberOfTables] = useState<number>(restaurant?.number_of_tables || 10);
  const [turnoverMinutes, setTurnoverMinutes] = useState<number>(restaurant?.reservation_turnover_minutes || 30);
  const [maxDuration, setMaxDuration] = useState<number>(restaurant?.max_reservation_duration_minutes || 120);

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

  const updateTableSettings = useMutation({
    mutationFn: async (settings: { 
      number_of_tables?: number; 
      reservation_turnover_minutes?: number;
      max_reservation_duration_minutes?: number;
    }) => {
      const { error } = await supabase
        .from("restaurants")
        .update(settings)
        .eq("id", restaurantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-reservation-settings", restaurantId] });
      toast.success(t("reservation.settingsUpdated"));
    },
    onError: () => {
      toast.error(t("reservation.error"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {t("reservation.reservationSettings")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("reservation.reservationSettingsDesc")}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="reservations-toggle" className="cursor-pointer text-sm">
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

      {restaurant?.reservations_enabled && (
        <div className="space-y-6 pt-4 border-t">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {t("reservation.tableConfiguration")}
            </h4>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="number-of-tables" className="text-sm">
                  {t("reservation.numberOfTables")}
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="number-of-tables"
                    min={1}
                    max={50}
                    step={1}
                    value={[numberOfTables]}
                    onValueChange={(value) => setNumberOfTables(value[0])}
                    onValueCommit={(value) => {
                      updateTableSettings.mutate({ number_of_tables: value[0] });
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={numberOfTables}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNumberOfTables(val);
                    }}
                    onBlur={() => {
                      updateTableSettings.mutate({ number_of_tables: numberOfTables });
                    }}
                    className="w-20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("reservation.numberOfTablesDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turnover-time" className="text-sm">
                  {t("reservation.turnoverTime")}
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="turnover-time"
                    min={15}
                    max={120}
                    step={15}
                    value={[turnoverMinutes]}
                    onValueChange={(value) => setTurnoverMinutes(value[0])}
                    onValueCommit={(value) => {
                      updateTableSettings.mutate({ reservation_turnover_minutes: value[0] });
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 w-28">
                    <Input
                      type="number"
                      min={15}
                      max={120}
                      step={15}
                      value={turnoverMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 15;
                        setTurnoverMinutes(val);
                      }}
                      onBlur={() => {
                        updateTableSettings.mutate({ reservation_turnover_minutes: turnoverMinutes });
                      }}
                      className="w-16"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("reservation.turnoverTimeDesc")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-duration" className="text-sm">
                  {t("reservation.maxDuration")}
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="max-duration"
                    min={30}
                    max={240}
                    step={30}
                    value={[maxDuration]}
                    onValueChange={(value) => setMaxDuration(value[0])}
                    onValueCommit={(value) => {
                      updateTableSettings.mutate({ max_reservation_duration_minutes: value[0] });
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 w-28">
                    <Input
                      type="number"
                      min={30}
                      max={240}
                      step={30}
                      value={maxDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 30;
                        setMaxDuration(val);
                      }}
                      onBlur={() => {
                        updateTableSettings.mutate({ max_reservation_duration_minutes: maxDuration });
                      }}
                      className="w-16"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("reservation.maxDurationDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
