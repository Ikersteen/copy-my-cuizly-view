import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toolName, arguments: toolArgs, userId } = await req.json();
    
    console.log(`🔧 Tool call: ${toolName}`, toolArgs);

    let result = { message: "Tool executed successfully" };

    switch (toolName) {
      case 'get_recommendations':
        // Here you could integrate with your restaurant database
        // For now, return a mock response
        const { cuisine, location, budget } = toolArgs;
        result = {
          message: `Voici quelques recommandations${cuisine ? ` de ${cuisine}` : ''}${location ? ` dans ${location}` : ''} :`,
          recommendations: [
            {
              name: "Restaurant Le Bremner",
              cuisine: cuisine || "Fruits de mer",
              location: location || "Vieux-Montréal",
              budget: budget || "Moyen",
              rating: 4.5,
              description: "Excellents fruits de mer dans une ambiance chaleureuse"
            },
            {
              name: "Joe Beef",
              cuisine: cuisine || "Bistro",
              location: location || "Little Burgundy",
              budget: budget || "Élevé",
              rating: 4.7,
              description: "Cuisine créative avec des produits locaux de qualité"
            }
          ]
        };
        break;

      default:
        result = { message: `Outil ${toolName} non reconnu` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in voice-tools-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});