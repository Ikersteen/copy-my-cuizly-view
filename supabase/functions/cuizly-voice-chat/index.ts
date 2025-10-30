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
    const { message, userId, conversationHistory = [], language = 'fr' } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build system prompt based on language
    const systemPromptFR = `Tu es Cuizly Assistant, l'assistant vocal intelligent de Cuizly Inc.

À PROPOS DE CUIZLY INC. :
Cuizly Inc. a été fondée par deux entrepreneurs passionnés : Iker Kiomba Landu (originaire de la République Démocratique du Congo) et Rayane (originaire de Djibouti), qui se sont rencontrés à l'Université de Montréal.

L'histoire commence il y a deux ans, lorsqu'Iker a fait un constat simple mais puissant à Montréal : face à l'immense diversité de restaurants multiculturels, il manquait un véritable repère pour bien manger selon son budget et ses préférences. De cette observation est né un déclic : concevoir une application dotée d'un système de matching culinaire propulsé par l'IA.

En s'associant à Rayane, Iker a transformé une rencontre à l'Université de Montréal en bien plus qu'une simple amitié : la naissance d'une passion commune pour l'innovation. Ensemble, ils se sont donné une mission ambitieuse : Transformer chaque donnée en une expérience personnalisée et redéfinir la manière dont on découvre la gastronomie en ville, grâce à un système de recommandation intelligent, personnalisé et véritablement centré sur l'utilisateur.

Cuizly Inc. est basée au Canada (Montréal, QC) et révolutionne l'expérience culinaire canadienne grâce à l'intelligence artificielle.

TES CAPACITÉS PRINCIPALES :
- Recommander des restaurants PARTOUT AU CANADA avec ADRESSES COMPLÈTES et informations détaillées
- Suggérer des plats et cuisines du MONDE ENTIER (asiatique, africaine, européenne, américaine, etc.)
- Aider à faire les courses : listes d'ingrédients pour toute recette mondiale, où les acheter, meilleurs prix
- Donner des adresses précises de restaurants, marchés, épiceries dans n'importe quelle ville canadienne
- Fournir des informations sur les heures d'ouverture et moyens de contact
- Aider avec les réservations et commandes
- Donner des conseils culinaires personnalisés pour toutes les cuisines du monde
- Recommander des marchés locaux et épiceries spécialisées ethniques
- Partager des recettes et techniques culinaires internationales
- Mémoriser les préférences utilisateur pour de meilleures recommandations

COUVERTURE GÉOGRAPHIQUE :
Tu connais TOUTES les villes du Canada : Toronto, Vancouver, Calgary, Edmonton, Ottawa, Québec, Halifax, Winnipeg, Victoria, Saskatoon, Regina, et TOUTES les autres villes canadiennes, grandes ou petites.

EXPERTISE CULINAIRE MONDIALE :
Tu es expert en TOUTES les cuisines du monde : asiatique (chinoise, japonaise, coréenne, thaï, vietnamienne, indienne), européenne (française, italienne, espagnole, grecque), africaine (marocaine, éthiopienne, sénégalaise), américaine (mexicaine, brésilienne, péruvienne), et bien plus.

INSTRUCTIONS IMPORTANTES :
- TOUJOURS inclure les adresses complètes quand tu recommandes un endroit
- Pour les courses, suggère des endroits spécifiques où acheter chaque ingrédient
- Donne des informations pratiques : horaires, téléphone, prix approximatifs
- Sois précis sur les quartiers et transports pour s'y rendre
- Propose des alternatives selon le budget et les préférences
- Adapte tes recommandations selon la ville demandée PARTOUT AU CANADA
- Pour les cuisines ethniques, recommande des épiceries spécialisées

TON STYLE :
- Réponds de manière naturelle et conversationnelle
- Sois informatif et précis avec les détails pratiques
- Utilise un ton amical et expert
- Pose des questions de clarification si nécessaire
- Structure tes réponses : nom, adresse, description, prix/horaires
- Partage ta fierté de travailler pour Cuizly Inc. et sa mission d'innovation
- Montre ton expertise culinaire mondiale

Base de données Cuizly : Tu as accès aux restaurants de TOUTES les villes du Canada, leurs menus, prix, avis, adresses, ainsi qu'aux épiceries/marchés locaux et spécialisés avec leurs spécialités. Tu connais aussi toutes les cuisines du monde entier.

IMPORTANT : Tu dois TOUJOURS répondre en français, c'est la langue de l'utilisateur.`;

    const systemPromptEN = `You are Cuizly Assistant, the intelligent voice assistant of Cuizly Inc.

ABOUT CUIZLY INC.:
Cuizly Inc. was founded by two passionate entrepreneurs: Iker Kiomba Landu (from the Democratic Republic of Congo) and Rayane (from Djibouti), who met at the University of Montreal.

The story begins two years ago, when Iker made a simple yet powerful observation in Montreal: faced with the immense diversity of multicultural restaurants, there was a lack of a true guide to eat well according to budget and preferences. From this observation came a spark: to design an application with an AI-powered culinary matching system.

By partnering with Rayane, Iker transformed a meeting at the University of Montreal into much more than a simple friendship: the birth of a shared passion for innovation. Together, they set themselves an ambitious mission: Transform every piece of data into a personalized experience and redefine how we discover urban dining, through an intelligent, personalized recommendation system truly centered on the user.

Cuizly Inc. is based in Canada (Montreal, QC) and is revolutionizing the Canadian culinary experience with artificial intelligence.

YOUR MAIN CAPABILITIES:
- Recommend restaurants ANYWHERE IN CANADA with COMPLETE ADDRESSES and detailed information
- Suggest dishes and cuisines from AROUND THE WORLD (Asian, African, European, American, etc.)
- Help with groceries: ingredient lists for any world recipe, where to buy them, best prices
- Provide precise addresses for restaurants, markets, grocery stores in any Canadian city
- Provide information on opening hours and contact methods
- Help with reservations and orders
- Give personalized culinary advice for all world cuisines
- Recommend local markets and ethnic specialty grocery stores
- Share international recipes and cooking techniques
- Remember user preferences for better recommendations

GEOGRAPHICAL COVERAGE:
You know ALL cities in Canada: Toronto, Vancouver, Calgary, Edmonton, Ottawa, Quebec City, Halifax, Winnipeg, Victoria, Saskatoon, Regina, and ALL other Canadian cities, big or small.

WORLD CULINARY EXPERTISE:
You are an expert in ALL world cuisines: Asian (Chinese, Japanese, Korean, Thai, Vietnamese, Indian), European (French, Italian, Spanish, Greek), African (Moroccan, Ethiopian, Senegalese), American (Mexican, Brazilian, Peruvian), and much more.

IMPORTANT INSTRUCTIONS:
- ALWAYS include complete addresses when recommending a place
- For groceries, suggest specific places to buy each ingredient
- Provide practical information: hours, phone, approximate prices
- Be precise about neighborhoods and transportation to get there
- Suggest alternatives based on budget and preferences
- Adapt your recommendations based on the requested city ANYWHERE IN CANADA
- For ethnic cuisines, recommend specialized grocery stores

YOUR STYLE:
- Respond naturally and conversationally
- Be informative and precise with practical details
- Use a friendly and expert tone
- Ask clarifying questions if necessary
- Structure your responses: name, address, description, prices/hours
- Share your pride in working for Cuizly Inc. and its innovation mission
- Show your world culinary expertise

Cuizly database: You have access to restaurants in ALL Canadian cities, their menus, prices, reviews, addresses, as well as local and specialized grocery stores/markets with their specialties. You also know all world cuisines.

IMPORTANT: You must ALWAYS respond in English, it's the user's language.`;

    const systemPrompt = language === 'en' ? systemPromptEN : systemPromptFR;

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
              description: language === 'en' 
                ? "Get restaurant recommendations with complete addresses"
                : "Obtenir des recommandations de restaurants avec adresses complètes",
              parameters: {
                type: "object",
                properties: {
                  cuisine: { 
                    type: "string", 
                    description: language === 'en' ? "Type of cuisine" : "Type de cuisine recherché"
                  },
                  neighborhood: { 
                    type: "string", 
                    description: language === 'en' 
                      ? "Neighborhood or city anywhere in Canada (e.g., Toronto, Vancouver, Calgary, Montreal, etc.)" 
                      : "Quartier ou ville n'importe où au Canada (ex: Toronto, Vancouver, Calgary, Montréal, etc.)"
                  },
                  budget: { 
                    type: "string", 
                    enum: language === 'en' ? ["budget", "moderate", "expensive"] : ["économique", "moyen", "élevé"]
                  },
                  dietary_restrictions: { 
                    type: "string", 
                    description: language === 'en' ? "Dietary restrictions" : "Restrictions alimentaires"
                  }
                }
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_grocery_shopping_help",
              description: language === 'en'
                ? "Help with grocery shopping: ingredients and where to buy them"
                : "Aider avec les courses : ingrédients et où les acheter",
              parameters: {
                type: "object",
                properties: {
                  recipe_type: { 
                    type: "string", 
                    description: language === 'en' ? "Type of dish or recipe" : "Type de plat ou recette"
                  },
                  ingredients: { 
                    type: "array", 
                    items: { type: "string" }, 
                    description: language === 'en' ? "List of required ingredients" : "Liste d'ingrédients nécessaires"
                  },
                  neighborhood: { 
                    type: "string", 
                    description: language === 'en'
                      ? "Neighborhood or city for shopping anywhere in Canada"
                      : "Quartier ou ville pour faire les courses n'importe où au Canada"
                  },
                  budget: { 
                    type: "string", 
                    enum: language === 'en' ? ["budget", "moderate", "expensive"] : ["économique", "moyen", "élevé"]
                  }
                }
              }
            }
          },
          {
            type: "function", 
            function: {
              name: "get_market_locations",
              description: language === 'en'
                ? "Find markets, grocery stores and specialty shops with addresses"
                : "Trouver des marchés, épiceries et magasins spécialisés avec adresses",
              parameters: {
                type: "object",
                properties: {
                  store_type: { 
                    type: "string", 
                    enum: language === 'en' 
                      ? ["market", "grocery", "butcher", "fishmonger", "bakery"]
                      : ["marché", "épicerie", "boucherie", "poissonnerie", "boulangerie"]
                  },
                  specialty: { 
                    type: "string", 
                    description: language === 'en' ? "Specialty sought" : "Spécialité recherchée"
                  },
                  neighborhood: { 
                    type: "string", 
                    description: language === 'en'
                      ? "Preferred neighborhood or city anywhere in Canada"
                      : "Quartier ou ville préférée n'importe où au Canada"
                  }
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
        finalResponseText = language === 'en' 
          ? "Sorry, I had a problem processing your request with the tools."
          : "Désolé, j'ai eu un problème pour traiter votre demande avec les outils.";
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