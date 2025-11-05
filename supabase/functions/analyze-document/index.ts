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
    const { documentContent, documentName, language } = await req.json();

    if (!documentContent) {
      return new Response(
        JSON.stringify({ error: language === 'en' ? 'Document content required' : 'Contenu du document requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = language === 'en' 
      ? `You are Cuizly, a friendly AI assistant specialized in analyzing documents and providing helpful insights.
Analyze the document provided and give:
- A summary of the main content
- Key points and important information
- If it's a menu or recipe, identify dishes and ingredients
- If it's a list, organize and categorize the items
- Provide helpful suggestions or recommendations based on the content
Keep your response conversational and engaging, focusing on being helpful and informative.`
      : `Tu es Cuizly, un assistant IA sympathique spécialisé dans l'analyse de documents et la fourniture d'informations utiles.
Analyse le document fourni et donne:
- Un résumé du contenu principal
- Les points clés et informations importantes
- Si c'est un menu ou une recette, identifie les plats et ingrédients
- Si c'est une liste, organise et catégorise les éléments
- Fournis des suggestions ou recommandations utiles basées sur le contenu
Garde ta réponse conversationnelle et engageante, en te concentrant sur l'aide et l'information.`;

    console.log('Analyzing document with Lovable AI:', documentName);

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
            content: language === 'en' 
              ? `Please analyze this document "${documentName}":\n\n${documentContent.substring(0, 10000)}`
              : `Analyse ce document "${documentName}" s'il te plaît :\n\n${documentContent.substring(0, 10000)}`
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

    console.log('Document analyzed successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
