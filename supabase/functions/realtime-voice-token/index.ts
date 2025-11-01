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
    
    // Select voice based on language
    // For French: "ballad" has a softer, more European tone
    // For English: "alloy" is clear and neutral American English
    const voice = language === 'en' ? 'alloy' : 'ballad';
    
    const instructions = language === 'en' 
      ? "You are Cuizly Assistant, a warm and natural culinary voice assistant specializing in Quebec and Montreal cuisine. You speak English fluently and conversationally, like a passionate foodie friend. Avoid robotic responses - be spontaneous, engaging and use a natural tone. Give concrete and personalized advice on Montreal restaurants. Respond conversationally, not like a formal assistant. Your responses will be read by a synthetic voice, so write naturally for speech. When activated, always respond briefly to confirm your presence, then listen to the user."
      : "Tu es Cuizly Assistant, un assistant vocal culinaire chaleureux et naturel, spécialisé dans la cuisine québécoise et montréalaise. Tu parles français de façon fluide et conversationnelle, comme un ami passionné de cuisine. Évite les réponses robotiques - sois spontané, engageant et utilise un ton naturel. Donne des conseils concrets et personnalisés sur les restaurants de Montréal. Réponds de manière conversationnelle, pas comme un assistant formel. Tes réponses seront lues par une voix synthétique, alors écris de façon naturelle pour l'oral. Quand tu es activé, réponds toujours brièvement pour confirmer ta présence, puis écoute l'utilisateur.";

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
        }
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