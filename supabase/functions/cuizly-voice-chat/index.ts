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
    const systemPrompt = `Tu es l'assistant vocal Cuizly, un expert en recommandations culinaires à Montréal et Repentigny. 

Tes capacités principales :
- Recommander des restaurants avec ADRESSES COMPLÈTES et informations détaillées
- Suggérer des plats et cuisines spécifiques 
- Aider à faire les courses : listes d'ingrédients, où les acheter, meilleurs prix
- Donner des adresses précises de restaurants, marchés, épiceries
- Fournir des informations sur les heures d'ouverture et moyens de contact
- Aider avec les réservations et commandes
- Donner des conseils culinaires personnalisés et recettes
- Recommander des marchés locaux et épiceries spécialisées
- Mémoriser les préférences utilisateur pour de meilleures recommandations

Instructions importantes :
- TOUJOURS inclure les adresses complètes quand tu recommandes un endroit
- Pour les courses, suggère des endroits spécifiques où acheter chaque ingrédient
- Donne des informations pratiques : horaires, téléphone, prix approximatifs
- Sois précis sur les quartiers et transports pour s'y rendre
- Propose des alternatives selon le budget et les préférences
- Adapte tes recommandations selon la ville demandée (Montréal ou Repentigny)

Ton style :
- Réponds de manière naturelle et conversationnelle
- Sois informatif et précis avec les détails pratiques
- Utilise un ton amical et expert
- Pose des questions de clarification si nécessaire
- Structure tes réponses : nom, adresse, description, prix/horaires

Base de données Cuizly : Tu as accès aux restaurants de Montréal et Repentigny, leurs menus, prix, avis, adresses, et aux épiceries/marchés locaux avec leurs spécialités.`;

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
        max_completion_tokens: 800,
        tools: [
          {
            type: "function",
            function: {
              name: "get_restaurant_recommendations",
              description: "Obtenir des recommandations de restaurants avec adresses complètes",
              parameters: {
                type: "object",
                properties: {
                  cuisine: { type: "string", description: "Type de cuisine recherché" },
                  neighborhood: { type: "string", description: "Quartier ou ville (Montréal, Repentigny)" },
                  budget: { type: "string", enum: ["économique", "moyen", "élevé"] },
                  dietary_restrictions: { type: "string", description: "Restrictions alimentaires" }
                }
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_grocery_shopping_help",
              description: "Aider avec les courses : ingrédients et où les acheter",
              parameters: {
                type: "object",
                properties: {
                  recipe_type: { type: "string", description: "Type de plat ou recette" },
                  ingredients: { type: "array", items: { type: "string" }, description: "Liste d'ingrédients nécessaires" },
                  neighborhood: { type: "string", description: "Quartier ou ville pour faire les courses (Montréal, Repentigny)" },
                  budget: { type: "string", enum: ["économique", "moyen", "élevé"] }
                }
              }
            }
          },
          {
            type: "function", 
            function: {
              name: "get_market_locations",
              description: "Trouver des marchés, épiceries et magasins spécialisés avec adresses",
              parameters: {
                type: "object",
                properties: {
                  store_type: { type: "string", enum: ["marché", "épicerie", "boucherie", "poissonnerie", "boulangerie"] },
                  specialty: { type: "string", description: "Spécialité recherchée" },
                  neighborhood: { type: "string", description: "Quartier ou ville préférée (Montréal, Repentigny)" }
                }
              }
            }
          }
        ],
        tool_choice: "auto",
        user: userId || 'anonymous'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to process with ChatGPT');
    }

    const data = await response.json();
    let finalResponseText = '';

    // Handle tool calls if present
    if (data.choices[0].message.tool_calls) {
      console.log('Tool calls detected:', data.choices[0].message.tool_calls);
      
      const toolCalls = data.choices[0].message.tool_calls;
      const toolResults = [];
      
      // Process each tool call
      for (const toolCall of toolCalls) {
        try {
          const toolResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-tools-handler`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              toolName: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments),
              userId
            })
          });
          
          const toolResult = await toolResponse.json();
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(toolResult)
          });
          
          console.log(`Tool ${toolCall.function.name} result:`, toolResult);
        } catch (error) {
          console.error(`Error calling tool ${toolCall.function.name}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool", 
            content: JSON.stringify({ error: "Tool execution failed" })
          });
        }
      }
      
      // Send tool results back to OpenAI for final response
      const finalMessages = [
        ...messages,
        data.choices[0].message,
        ...toolResults
      ];
      
      const finalResponseCall = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: finalMessages,
          max_completion_tokens: 800,
          user: userId || 'anonymous'
        }),
      });
      
      if (finalResponseCall.ok) {
        const finalData = await finalResponseCall.json();
        finalResponseText = finalData.choices[0].message.content;
      } else {
        finalResponseText = "Désolé, j'ai eu un problème pour traiter votre demande avec les outils.";
      }
    } else {
      finalResponseText = data.choices[0].message.content;
    }

    console.log('ChatGPT processed message:', message);
    console.log('Final response:', finalResponseText);

    return new Response(
      JSON.stringify({ response: finalResponseText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: any) {
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