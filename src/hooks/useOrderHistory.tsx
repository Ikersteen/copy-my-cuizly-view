import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  restaurant_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  restaurant?: {
    name: string;
    cuisine_type: string[];
  };
}

export const useOrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants!restaurant_id(name, cuisine_type)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const formattedOrders = (data || []).map(order => ({
        ...order,
        restaurant: order.restaurants || undefined
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading };
};