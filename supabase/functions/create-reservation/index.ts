import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { 
      restaurant_id,
      user_id,
      reservation_date,
      reservation_time,
      party_size,
      customer_name,
      customer_email,
      customer_phone,
      special_requests
    } = await req.json();

    console.log('Creating reservation:', {
      restaurant_id,
      user_id,
      reservation_date,
      reservation_time,
      party_size,
      customer_name
    });

    // Vérifier que le restaurant accepte les réservations
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .rpc('get_public_restaurants')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurant non trouvé');
    }

    if (!restaurant.reservations_enabled) {
      throw new Error('Ce restaurant n\'accepte pas les réservations pour le moment');
    }

    // Créer la réservation
    const { data: reservation, error: reservationError } = await supabaseClient
      .from('reservations')
      .insert([{
        restaurant_id,
        user_id,
        reservation_date,
        reservation_time,
        party_size,
        customer_name,
        customer_email,
        customer_phone,
        special_requests,
        status: 'pending'
      }])
      .select()
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      throw reservationError;
    }

    console.log('Reservation created successfully:', reservation.id);

    return new Response(
      JSON.stringify({
        success: true,
        reservation,
        message: `Réservation confirmée pour ${party_size} personne(s) le ${reservation_date} à ${reservation_time}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-reservation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
