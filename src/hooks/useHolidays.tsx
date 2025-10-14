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

// Default Canadian holidays for 2025
const getCanadianHolidays2025 = () => [
  { name: "New Year's Day", date: "2025-01-01" },
  { name: "Good Friday", date: "2025-04-18" },
  { name: "Easter Monday", date: "2025-04-21" },
  { name: "Victoria Day", date: "2025-05-19" },
  { name: "Canada Day", date: "2025-07-01" },
  { name: "Civic Holiday", date: "2025-08-04" },
  { name: "Labour Day", date: "2025-09-01" },
  { name: "National Day for Truth and Reconciliation", date: "2025-09-30" },
  { name: "Thanksgiving", date: "2025-10-13" },
  { name: "Remembrance Day", date: "2025-11-11" },
  { name: "Christmas Day", date: "2025-12-25" },
  { name: "Boxing Day", date: "2025-12-26" },
];

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
      
      // If no holidays exist, initialize with Canadian holidays
      if (data.length === 0) {
        const canadianHolidays = getCanadianHolidays2025();
        const holidaysToInsert = canadianHolidays.map(h => ({
          restaurant_id: restaurantId,
          holiday_name: h.name,
          holiday_date: h.date,
          is_enabled: false, // Disabled by default
          is_recurring: true,
          country: 'Canada'
        }));
        
        const { data: insertedData, error: insertError } = await supabase
          .from("restaurant_holidays")
          .insert(holidaysToInsert)
          .select();
        
        if (insertError) {
          console.error("Error initializing holidays:", insertError);
          return [];
        }
        
        return insertedData as Holiday[];
      }
      
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
