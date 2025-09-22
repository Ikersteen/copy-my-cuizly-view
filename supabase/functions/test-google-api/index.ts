import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🧪 Test de l'API Google Maps");

    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "GOOGLE_MAPS_API_KEY n'est pas configuré",
          apiKey: "missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Test simple avec Places API
    const testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=45.5017,-73.5673&radius=1000&type=restaurant&key=${googleMapsApiKey}`;
    
    console.log(`🔍 Test URL: ${testUrl.replace(googleMapsApiKey, '***API_KEY***')}`);
    
    const response = await fetch(testUrl);
    const data = await response.json();

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response data:`, JSON.stringify(data, null, 2));

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      apiKeyPresent: true,
      googleResponse: data,
      testUrl: testUrl.replace(googleMapsApiKey, '***API_KEY***')
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("💥 Erreur test:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});