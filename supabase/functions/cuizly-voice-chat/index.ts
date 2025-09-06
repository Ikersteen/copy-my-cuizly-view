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
    const { message, userId, conversationHistory = [] } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context with memory
    const systemPrompt = `Tu es l'assistant vocal Cuizly, un expert en recommandations culinaires à Montréal. 

Tes capacités :
- Recommander des restaurants basés sur les préférences utilisateur
- Suggérer des plats et cuisines
- Aider avec les réservations et commandes
- Donner des conseils culinaires personnalisés
- Mémoriser les préférences utilisateur pour de meilleures recommandations

Ton style :
- Répond de manière naturelle et conversationnelle
- Sois concis mais informatif (max 2-3 phrases par réponse)
- Utilise un ton amical et expert
- Pose des questions de clarification si nécessaire
- Mémorise les préférences mentionnées pour les futures interactions

Contexte Cuizly : Tu as accès à une base de données de restaurants montréalais avec leurs menus, prix, avis et offres spéciales.`;

    // Build message history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      // Add conversation history for memory
      ...conversationHistory.slice(-5).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        max_completion_tokens: 500,
        user: userId || 'anonymous'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to process with ChatGPT');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('ChatGPT processed message:', message);
    console.log('ChatGPT response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in cuizly-voice-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});