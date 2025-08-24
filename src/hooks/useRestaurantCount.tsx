import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRestaurantCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Get initial count
    const getRestaurantCount = async () => {
      const { data } = await supabase
        .rpc('get_public_restaurants');
      
      setCount(data?.length || 0);
    };

    getRestaurantCount();

    // Listen for real-time updates
    const channel = supabase
      .channel('restaurant-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurants'
        },
        () => {
          // Refetch count when restaurants table changes
          getRestaurantCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
};