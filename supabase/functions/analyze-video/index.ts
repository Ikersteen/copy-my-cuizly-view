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
    const { videoBase64, language = 'fr', prompt } = await req.json();
    
    if (!videoBase64) {
      throw new Error('Video data is required');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing video with Lovable AI');

    const systemPromptFR = `Tu es Cuizly Assistant, un expert en analyse vidéo culinaire et alimentaire.

Analyse cette vidéo et fournis:
1. **Description détaillée** : Décris ce que tu vois dans la vidéo (plats, ingrédients, actions, environnement)
2. **Identification** : Si tu vois de la nourriture, identifie les plats, ingrédients ou produits alimentaires
3. **Analyse nutritionnelle** : Si applicable, donne des informations nutritionnelles
4. **Conseils** : Propose des suggestions, recettes similaires ou conseils culinaires
5. **Contexte** : Si c'est dans un restaurant, une cuisine, un marché, mentionne-le

Sois conversationnel, détaillé et engageant dans ton analyse.`;

    const systemPromptEN = `You are Cuizly Assistant, an expert in culinary and food video analysis.

Analyze this video and provide:
1. **Detailed description**: Describe what you see in the video (dishes, ingredients, actions, environment)
2. **Identification**: If you see food, identify the dishes, ingredients or food products
3. **Nutritional analysis**: If applicable, provide nutritional information
4. **Advice**: Suggest similar recipes or culinary tips
5. **Context**: If it's in a restaurant, kitchen, market, mention it

Be conversational, detailed and engaging in your analysis.`;

    const systemPrompt = language === 'fr' ? systemPromptFR : systemPromptEN;

    // For video analysis, we'll use Lovable AI with video support
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
                text: prompt || (language === 'fr' ? 'Analyse cette vidéo en détail.' : 'Analyze this video in detail.')
              },
              {
                type: 'video_url',
                video_url: {
                  url: videoBase64
                }
              }
            ]
          }
        ],
        stream: true
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add funds to continue.' }), 
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    console.log('Returning streaming response for video analysis');

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
