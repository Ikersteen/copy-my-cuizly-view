import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoBase64, userMessage, language } = await req.json();
    
    console.log('Analyzing video with Lovable AI');

    const systemPrompt = language === 'en'
      ? "You are Cuizly Assistant, an expert AI specialized in food, cooking, and restaurants. Analyze this video carefully and provide detailed insights about what you see. If it's food-related, describe ingredients, cooking techniques, presentation, or suggest recipes. If it's a restaurant, describe the ambiance, dishes visible, or provide recommendations."
      : "Tu es Cuizly Assistant, une IA experte spécialisée en alimentation, cuisine et restaurants. Analyse cette vidéo attentivement et fournis des informations détaillées sur ce que tu vois. Si c'est lié à la nourriture, décris les ingrédients, les techniques de cuisson, la présentation ou suggère des recettes. Si c'est un restaurant, décris l'ambiance, les plats visibles ou fournis des recommandations.";

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: userMessage || (language === 'en' ? 'Analyze this video' : 'Analyse cette vidéo')
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:video/mp4;base64,${videoBase64}`
                }
              }
            ]
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    console.log('Streaming video analysis response');

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
