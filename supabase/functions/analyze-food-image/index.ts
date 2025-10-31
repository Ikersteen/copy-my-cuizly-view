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
    const { imageBase64, language } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = language === 'en' 
      ? `You are Cuizly, a friendly culinary AI assistant specialized in food recognition and recommendations. 
Analyze the food image provided and give:
- The name of the dish
- Main ingredients you can identify
- Approximate nutritional information (calories, proteins, carbs, fats)
- If it's a restaurant dish, suggest similar dishes the user might like
- Culinary tips or interesting facts about this dish
Keep your response conversational and engaging, as if you're a passionate chef sharing knowledge with a food lover.`
      : `Tu es Cuizly, un assistant culinaire IA sympathique spécialisé dans la reconnaissance de nourriture et les recommandations.
Analyse l'image de nourriture fournie et donne:
- Le nom du plat
- Les ingrédients principaux que tu peux identifier
- Les informations nutritionnelles approximatives (calories, protéines, glucides, lipides)
- Si c'est un plat de restaurant, suggère des plats similaires que l'utilisateur pourrait aimer
- Des conseils culinaires ou des faits intéressants sur ce plat
Garde ta réponse conversationnelle et engageante, comme si tu étais un chef passionné partageant ses connaissances avec un amateur de cuisine.`;

    console.log('Analyzing food image with Lovable AI');

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
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              },
              {
                type: 'text',
                text: language === 'en' 
                  ? 'What food is in this image? Tell me everything about it!'
                  : 'Quelle nourriture y a-t-il dans cette image ? Dis-moi tout à son sujet !'
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: language === 'en' ? 'Rate limit exceeded. Please try again later.' : 'Limite de débit dépassée. Veuillez réessayer plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: language === 'en' ? 'Payment required. Please add credits.' : 'Paiement requis. Veuillez ajouter des crédits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis received from AI');
    }

    console.log('Food image analyzed successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-food-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
