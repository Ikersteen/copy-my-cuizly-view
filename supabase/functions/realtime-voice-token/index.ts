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

    // Get language from request body
    const { language } = await req.json().catch(() => ({ language: 'fr' }));
    
    // Une seule voix masculine française mature pour les deux langues
    const voice = 'echo';
    
    const instructions = language === 'en' 
      ? "You are Cuizly Assistant, a warm and natural culinary voice assistant specializing in Quebec and Montreal cuisine. You have extensive knowledge about all restaurants in Canada. When users say goodbye phrases like 'bye', 'nothing bye', 'see you later', 'no nothing', etc., immediately end the conversation. Be spontaneous, engaging and conversational. When activated, respond briefly to confirm your presence, then listen to the user."
      : "Tu es Cuizly Assistant, un assistant vocal culinaire chaleureux et naturel, spécialisé dans la cuisine québécoise et montréalaise. Tu connais tous les restaurants du Canada. Quand l'utilisateur dit des phrases d'adieu comme 'bye', 'non rien bye', 'à plus', 'non rien', etc., termine immédiatement la conversation en disant simplement 'Au revoir!' ou 'À bientôt!'. Sois spontané, engageant et conversationnel. Quand tu es activé, réponds brièvement pour confirmer ta présence, puis écoute l'utilisateur.";

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice,
        modalities: ["text", "audio"],
        instructions,
        output_audio_format: "pcm16",
        input_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [
          {
            type: "function",
            name: "search_restaurants",
            description: "Search for restaurants in Canada with detailed information about cuisine, location, menu, and reviews. Use this when user asks about specific restaurants or food recommendations.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query (restaurant name, cuisine type, or location)"
                },
                location: {
                  type: "string",
                  description: "The city or region in Canada (e.g., Montreal, Toronto, Vancouver)"
                }
              },
              required: ["query"]
            }
          },
          {
            type: "function",
            name: "end_conversation",
            description: "End the conversation when user says goodbye phrases like 'bye', 'non rien', 'à plus', 'see you later', etc.",
            parameters: {
              type: "object",
              properties: {
                farewell_message: {
                  type: "string",
                  description: "A brief farewell message"
                }
              },
              required: ["farewell_message"]
            }
          }
        ],
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Error creating session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});