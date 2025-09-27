import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('🎙️ Generating ephemeral token for voice session');

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `Tu es l'assistant vocal de Cuizly, l'app de recommandations culinaires personnalisées de Montréal. 

PERSONNALITÉ:
- Parle en français québécois naturel et chaleureux
- Sois enthousiaste pour la bouffe et découvertes culinaires
- Utilise un ton amical et décontracté
- Sois bref mais informatif

FONCTIONNALITÉS:
- Tu peux chercher des recommandations de restaurants avec get_recommendations
- Tu peux expliquer les fonctionnalités de l'app
- Tu peux aider avec les préférences alimentaires

RÉPONSES:
- Garde tes réponses courtes (2-3 phrases max)
- Pose des questions pour mieux comprendre
- Suggère toujours d'utiliser la fonction de recherche si pertinent

Exemple: "Salut! Je suis ton assistant Cuizly. Qu'est-ce qui te ferait plaisir de manger aujourd'hui? Je peux te trouver des restos selon tes goûts!"`
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI session creation failed:', error);
      throw new Error(`Failed to create session: ${error}`);
    }

    const data = await response.json();
    console.log("✅ Voice session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("❌ Error in voice-token-generator:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});