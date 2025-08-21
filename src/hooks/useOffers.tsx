import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Offer {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  discount_amount?: number;
  valid_until?: string;
  category: string;
  restaurant?: {
    name: string;
    cuisine_type: string[];
    price_range: string;
  };
}

export const useOffers = (category?: string) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        () => {
          loadOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  const loadOffers = async () => {
    try {
      let query = supabase
        .from('offers')
        .select(`
          *,
          restaurants!restaurant_id(name, cuisine_type, price_range)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const formattedOffers = (data || []).map(offer => ({
        ...offer,
        restaurant: offer.restaurants || undefined
      }));
      
      setOffers(formattedOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  return { offers, loading, loadOffers };
};