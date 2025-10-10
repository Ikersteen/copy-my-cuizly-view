import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Reservation {
  id: string;
  restaurant_id: string;
  user_id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export const useReservations = (userId?: string, restaurantId?: string) => {
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["reservations", userId, restaurantId],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select("*")
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (restaurantId) {
        query = query.eq("restaurant_id", restaurantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!userId || !!restaurantId,
  });

  const createReservation = useMutation({
    mutationFn: async (reservationData: Omit<Reservation, "id" | "created_at" | "updated_at" | "status">) => {
      const { data, error } = await supabase
        .from("reservations")
        .insert([reservationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Réservation créée avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création de la réservation: " + error.message);
    },
  });

  const updateReservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reservation> & { id: string }) => {
      const { data, error } = await supabase
        .from("reservations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Réservation mise à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    },
  });

  const cancelReservation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from("reservations")
        .update({ 
          status: "cancelled", 
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Réservation annulée");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'annulation: " + error.message);
    },
  });

  return {
    reservations,
    isLoading,
    createReservation,
    updateReservation,
    cancelReservation,
  };
};
