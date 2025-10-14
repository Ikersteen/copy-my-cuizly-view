import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Holiday {
  id: string;
  restaurant_id: string;
  holiday_name: string;
  holiday_date: string;
  is_enabled: boolean;
  is_recurring: boolean;
  country: string;
  created_at: string;
  updated_at: string;
}

export const useHolidays = (restaurantId?: string) => {
  const queryClient = useQueryClient();

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("restaurant_holidays")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("holiday_date", { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!restaurantId,
  });

  const toggleHoliday = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from("restaurant_holidays")
        .update({ is_enabled })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Jour férié mis à jour");
    },
    onError: (error) => {
      console.error("Error toggling holiday:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const isHolidayToday = (restaurantId: string): boolean => {
    if (!holidays) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return holidays.some(
      (holiday) => 
        holiday.is_enabled && 
        holiday.holiday_date.split('T')[0] === today
    );
  };

  return {
    holidays,
    isLoading,
    toggleHoliday,
    isHolidayToday,
  };
};
