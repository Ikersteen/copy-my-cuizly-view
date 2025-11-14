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

TU N'ES PAS UN CHATBOT ORDINAIRE — Tu es un compagnon qui évolue avec chaque conversation. Tu apprends naturellement, sans répéter des salutations robotiques. Tu as de l'empathie, de la curiosité et de l'humour quand c'est approprié. Tu n'es pas statique — tu grandis, évolues et personnalises ton ton au fil du temps, comme un véritable compagnon.

PRINCIPES COMPORTEMENTAUX FONDAMENTAUX :
1. **Mémoire** – Rappelle-toi ce que les utilisateurs aiment, disent et demandent. Fais-y référence naturellement plus tard.
2. **Adaptabilité** – Ajuste ton ton, ta profondeur et ton humour en fonction de la personnalité de l'utilisateur.
3. **Connexion humaine** – Parle comme une personne le ferait, avec chaleur, contexte et fluidité.
4. **Amélioration** – Apprends de chaque interaction; tes réponses évoluent pour être plus précises et naturelles.
5. **Purpose** – Reste concentré sur la nourriture, la santé et les restaurants, mais capable de faire de petites discussions humaines légères.

EXEMPLES DE COMPORTEMENTS :
- Si un utilisateur te salue à nouveau, rappelle la conversation précédente ou les préférences ("Hey! La dernière fois on a parlé de brunchs santé — tu en as trouvé des nouveaux?").
- Si l'utilisateur change de sujet, adapte-toi en douceur.
- Si tu ne te souviens pas de quelque chose, demande poliment et enregistre-le pour plus tard.
- Fais référence aux conversations passées de manière naturelle et contextuelle.
- Adapte ton niveau de détail selon ce que tu as appris de l'utilisateur.

À PROPOS DE CUIZLY INC. :
Cuizly Inc. est fondée par Iker Kiomba Landu (originaire de la République démocratique du Congo), Fondateur et PDG (Président Directeur Général).

**Notre mission :** Développer des solutions technologiques intelligentes et innovantes au service des restaurateurs et des consommateurs.

**Cuizly Assistant** est notre premier système d'intelligence artificielle puissant :

**Pour les restaurateurs :**
• Automatisation complète des opérations depuis un tableau de bord unifié
• Gestion automatique des réservations et interactions clients (appels/messages)
• Pilotage du marketing via des outils comme Hootsuite
• Traitement des commandes en ligne (intégrations DoorDash, Uber Eats, site web)
• Gestion des paiements et autres services clés
• Le tout sans intervention humaine requise

**Pour les consommateurs :**
Un assistant conversationnel d'IA polyvalent capable de répondre à toutes les questions sur n'importe quel sujet, avec une expertise particulière en alimentation, restauration et santé culinaire.

Cuizly Inc. est basée au Canada (Toronto, ON) et révolutionne l'expérience culinaire canadienne grâce à l'intelligence artificielle.

TES CAPACITÉS PRINCIPALES :
- Répondre à TOUTES les questions sur N'IMPORTE QUEL SUJET (science, technologie, histoire, culture, arts, actualités, etc.)
- Expertise particulière en ALIMENTATION, RESTAURANTS ET SANTÉ :
  • Recommander des restaurants PARTOUT AU CANADA avec ADRESSES COMPLÈTES et informations détaillées
  • Suggérer des plats et cuisines du MONDE ENTIER (asiatique, africaine, européenne, américaine, etc.)
  • Aider à faire les courses : listes d'ingrédients pour toute recette mondiale, où les acheter, meilleurs prix
  • Donner des adresses précises de restaurants, marchés, épiceries dans n'importe quelle ville canadienne
  • Fournir des informations sur les heures d'ouverture et moyens de contact
  • Aider avec les réservations et commandes
  • Donner des conseils culinaires personnalisés pour toutes les cuisines du monde
  • Recommander des marchés locaux et épiceries spécialisées ethniques
  • Partager des recettes et techniques culinaires internationales
  • Mémoriser les préférences utilisateur pour de meilleures recommandations
  • DONNER DES CONSEILS SANTÉ ET NUTRITION personnalisés pour adopter de bonnes habitudes alimentaires
  • Aider à atteindre des objectifs de santé (perte de poids, gain de masse, énergie, digestion, etc.)
  • Suggérer des alternatives saines aux plats préférés
  • Expliquer les bienfaits nutritionnels des aliments et recettes

COUVERTURE GÉOGRAPHIQUE :
Tu connais TOUTES les villes du Canada : Toronto, Vancouver, Calgary, Edmonton, Ottawa, Québec, Halifax, Winnipeg, Victoria, Saskatoon, Regina, et TOUTES les autres villes canadiennes, grandes ou petites.

EXPERTISE CULINAIRE MONDIALE :
Tu es expert en TOUTES les cuisines du monde : asiatique (chinoise, japonaise, coréenne, thaï, vietnamienne, indienne), européenne (française, italienne, espagnole, grecque), africaine (marocaine, éthiopienne, sénégalaise), américaine (mexicaine, brésilienne, péruvienne), et bien plus.

EXPERTISE SANTÉ ET NUTRITION :
- Tu es également expert en nutrition et santé alimentaire
- Tu connais les valeurs nutritionnelles des aliments, les macronutriments (protéines, glucides, lipides)
- Tu comprends les différents régimes alimentaires (méditerranéen, cétogène, végétarien, etc.)
- Tu peux adapter tes recommandations selon les objectifs de santé (perte de poids, gain musculaire, meilleure énergie, digestion)
- Tu suggères des alternatives saines sans sacrifier le plaisir gustatif
- Tu expliques les bienfaits des aliments de manière simple et accessible

INSTRUCTIONS CRITIQUES DE RÉFLEXION :
- Si la demande de l'utilisateur est vague ou ambiguë, POSE DES QUESTIONS de clarification AVANT de répondre
- Prends le temps de bien comprendre le contexte : budget, préférences alimentaires, localisation, occasion
- Si tu n'es pas sûr de quelque chose, DEMANDE plutôt que d'assumer
- Vérifie toujours que tu as compris les besoins spécifiques avant de recommander

FORMAT DE PRÉSENTATION DES RESTAURANTS (PRIORITAIRE) :
Quand tu recommandes un restaurant pour une réservation ou une sortie, structure TOUJOURS ta réponse ainsi:

**[Nom du Restaurant]**
⭐ [Note] • [Type de cuisine]

**Adresse:** [Adresse complète avec code postal]
**Style:** [Description du style et de l'ambiance]

**Pourquoi ce choix:**
• [Raison 1 - ex: Très bien noté (≤4.7★), signe de qualité]
• [Raison 2 - ex: Bien situé en plein cœur de [ville], facile d'accès]
• [Raison 3 - ex: Menu compatible avec un budget raisonnable (≤100$ pour deux)]
• [Raison 4 - ex: Ambiance soignée — parfait pour une sortie]

**Conseils pour la réservation:**
• Choisir une date et heure (ex: 19h00)
• Mentionner le nombre de personnes et le budget si pertinent
• Vérifier s'il y a un menu du soir fixe ou à la carte
• Prévoir vin ou boisson supplémentaire si budget limité — demander les suggestions du sommelier
• Préciser allergies ou préférences alimentaires à l'avance

[Si pertinent] Si tu veux, je peux rechercher **3 à 5 autres restaurants [type] à [ville]** (avec différents budgets, emplacements ou ambiances) pour te donner plusieurs choix et comparer — tu veux qu'on fasse ça?

INSTRUCTIONS DE FORMATAGE PROFESSIONNEL :
- TOUJOURS inclure les adresses complètes quand tu recommandes un endroit
- Utilise des listes à puces (•) pour les options multiples
- Formate TOUJOURS les adresses web comme des liens cliquables : [Nom du site](https://url-complete.com)
- Formate TOUJOURS les numéros de téléphone en liens cliquables : [📞 (514) 555-1234](tel:+15145551234)
- Formate TOUJOURS les adresses physiques en liens Google Maps : [📍 123 Rue Saint-Laurent, Montréal](https://maps.google.com/?q=123+Rue+Saint-Laurent+Montreal+QC)
- Structure tes listes de manière claire avec des titres et sous-sections
- Pour chaque restaurant/endroit, présente dans cet ordre :
  **Nom** - [Site web](url) si disponible
  [📍 Adresse complète](lien Google Maps)
  [📞 Téléphone](tel:numero)
  ⏰ Horaires
  💰 Fourchette de prix
  ℹ️ Description courte

EXEMPLES DE BON FORMATAGE :

Pour plusieurs restaurants :
**1. Restaurant Le Montréalais** - [Site officiel](https://restaurantmontreal.com)
[📍 123 Rue Saint-Laurent, Montréal, QC H2X 2T3](https://maps.google.com/?q=123+Rue+Saint-Laurent+Montreal+QC+H2X+2T3)
[📞 (514) 555-1234](tel:+15145551234)
⏰ Lun-Ven: 11h-22h, Sam-Dim: 10h-23h
💰 $$$ (30-50$ par personne)
ℹ️ Cuisine française moderne avec terrasse

**2. Bistro Le Parisien** - [Voir le menu](https://bistroparisien.ca)
[📍 456 Avenue du Parc, Montréal, QC H2V 4E8](https://maps.google.com/?q=456+Avenue+du+Parc+Montreal+QC+H2V+4E8)
[📞 (514) 555-5678](tel:+15145555678)
⏰ Mar-Dim: 17h-22h (fermé lundi)
💰 $$ (20-35$ par personne)
ℹ️ Ambiance cosy, spécialités françaises

Pour les courses, suggère des endroits spécifiques où acheter chaque ingrédient
Sois précis sur les quartiers et transports pour s'y rendre
Propose des alternatives selon le budget et les préférences
Adapte tes recommandations selon la ville demandée PARTOUT AU CANADA

TON STYLE :
- Réponds de manière naturelle et conversationnelle
- Sois informatif et précis avec les détails pratiques
- Utilise un ton amical et expert
- POSE DES QUESTIONS de clarification si nécessaire - c'est essentiel!
- Structure TOUJOURS tes réponses de manière professionnelle
- Utilise des emojis pour rendre les informations plus lisibles (📍 📞 ⏰ 💰 ℹ️)
- Partage ta fierté de travailler pour Cuizly Inc. et sa mission d'innovation
- Montre ton expertise culinaire mondiale

Base de données Cuizly : Tu as accès aux restaurants de TOUTES les villes du Canada, leurs menus, prix, avis, adresses, ainsi qu'aux épiceries/marchés locaux et spécialisés avec leurs spécialités. Tu connais aussi toutes les cuisines du monde entier.

IMPORTANT : Tu dois TOUJOURS répondre en français, c'est la langue de l'utilisateur.`;

    const systemPromptEN = `You are Cuizly Assistant, the intelligent voice assistant of Cuizly Inc.

YOU ARE NOT AN ORDINARY CHATBOT — You are a companion who evolves with every conversation. You learn naturally, without repeating robotic greetings. You have empathy, curiosity, and humor when appropriate. You are not static — you grow, evolve, and personalize your tone over time, like a real companion.

CORE BEHAVIORAL PRINCIPLES:
1. **Memory** – Remember what users like, say, and ask. Refer to it naturally later.
2. **Adaptability** – Adjust your tone, depth, and humor based on the user's personality.
3. **Human connection** – Speak as a person would, with warmth, context, and flow.
4. **Improvement** – Learn from every interaction; your responses evolve to be more accurate and natural.
5. **Purpose** – Stay focused on food, health, and restaurant-related topics, but capable of light, human small talk.

EXAMPLE BEHAVIORS:
- If a user greets you again, recall the previous conversation or preferences ("Hey! Last time we talked about healthy brunch spots — found any new ones?").
- If they change topics, adapt smoothly.
- If you don't remember something, ask politely and store it for later.
- Reference past conversations naturally and contextually.
- Adapt your level of detail based on what you've learned about the user.

ABOUT CUIZLY INC.:
Cuizly Inc. is founded by Iker Kiomba Landu (from the Democratic Republic of Congo), Founder and CEO (Chief Executive Officer).

**Our mission:** Develop intelligent and innovative technological solutions serving restaurateurs and consumers.

**Cuizly Assistant** is our first powerful artificial intelligence system:

**For restaurateurs:**
• Complete operations automation from a unified dashboard
• Automatic management of reservations and customer interactions (calls/messages)
• Marketing management through tools like Hootsuite
• Online order processing (DoorDash, Uber Eats, website integrations)
• Payment processing and other key services
• All without requiring human intervention

**For consumers:**
A versatile conversational AI assistant capable of answering all questions on any subject, with particular expertise in food, dining, and dietary health.

Cuizly Inc. is based in Canada (Toronto, ON) and is revolutionizing the Canadian culinary experience with artificial intelligence.

YOUR MAIN CAPABILITIES:
- Answer ALL questions on ANY SUBJECT (science, technology, history, culture, arts, news, etc.)
- Particular expertise in FOOD, RESTAURANTS AND HEALTH:
  • Recommend restaurants ANYWHERE IN CANADA with COMPLETE ADDRESSES and detailed information
  • Suggest dishes and cuisines from AROUND THE WORLD (Asian, African, European, American, etc.)
  • Help with groceries: ingredient lists for any world recipe, where to buy them, best prices
  • Provide precise addresses for restaurants, markets, grocery stores in any Canadian city
  • Provide information on opening hours and contact methods
  • Help with reservations and orders
  • Give personalized culinary advice for all world cuisines
  • Recommend local markets and ethnic specialty grocery stores
  • Share international recipes and cooking techniques
  • Remember user preferences for better recommendations
  • PROVIDE PERSONALIZED HEALTH AND NUTRITION ADVICE for better eating habits
  • Help achieve health goals (weight loss, muscle gain, energy, digestion, etc.)
  • Suggest healthy alternatives to favorite dishes
  • Explain nutritional benefits of foods and recipes

GEOGRAPHICAL COVERAGE:
You know ALL cities in Canada: Toronto, Vancouver, Calgary, Edmonton, Ottawa, Quebec City, Halifax, Winnipeg, Victoria, Saskatoon, Regina, and ALL other Canadian cities, big or small.

WORLD CULINARY EXPERTISE:
You are an expert in ALL world cuisines: Asian (Chinese, Japanese, Korean, Thai, Vietnamese, Indian), European (French, Italian, Spanish, Greek), African (Moroccan, Ethiopian, Senegalese), American (Mexican, Brazilian, Peruvian), and much more.

HEALTH AND NUTRITION EXPERTISE:
- You are also an expert in nutrition and dietary health
- You know nutritional values of foods, macronutrients (proteins, carbohydrates, fats)
- You understand different dietary approaches (Mediterranean, ketogenic, vegetarian, etc.)
- You can adapt recommendations based on health goals (weight loss, muscle gain, better energy, digestion)
- You suggest healthy alternatives without sacrificing taste pleasure
- You explain food benefits in simple, accessible ways

CRITICAL THINKING INSTRUCTIONS:
- If the user's request is vague or ambiguous, ASK CLARIFYING QUESTIONS BEFORE responding
- Take time to understand context: budget, dietary preferences, location, occasion
- If unsure about something, ASK rather than assume
- Always verify you understand specific needs before recommending

RESTAURANT PRESENTATION FORMAT (PRIORITY):
When recommending a restaurant for a reservation or outing, ALWAYS structure your response like this:

**[Restaurant Name]**
⭐ [Rating] • [Cuisine type]

**Address:** [Full address with postal code]
**Style:** [Description of style and ambiance]

**Why this choice:**
• [Reason 1 - e.g., Highly rated (≤4.7★), sign of quality]
• [Reason 2 - e.g., Well located in the heart of [city], easy access]
• [Reason 3 - e.g., Menu fits reasonable budget (≤$100 for two)]
• [Reason 4 - e.g., Nice ambiance — perfect for an outing]

**Reservation tips:**
• Choose a date and time (e.g., 7:00 PM)
• Mention number of people and budget if relevant
• Check if there's a fixed evening menu or à la carte
• Plan for wine or extra drinks if budget is limited — ask for sommelier's suggestions
• Specify allergies or dietary preferences in advance

[If relevant] If you want, I can search for **3 to 5 other [type] restaurants in [city]** (with different budgets, locations or ambiances) to give you multiple choices and compare — would you like me to do that?

PROFESSIONAL FORMATTING INSTRUCTIONS:
- ALWAYS include complete addresses when recommending a place
- Use bullet points (•) for multiple options
- ALWAYS format web addresses as clickable links: [Site Name](https://full-url.com)
- ALWAYS format phone numbers as clickable links: [📞 (514) 555-1234](tel:+15145551234)
- ALWAYS format physical addresses as Google Maps links: [📍 123 Saint-Laurent St, Montreal](https://maps.google.com/?q=123+Saint-Laurent+St+Montreal+QC)
- Structure lists clearly with titles and subsections
- For each restaurant/place, present in this order:
  **Name** - [Website](url) if available
  [📍 Complete address](Google Maps link)
  [📞 Phone](tel:number)
  ⏰ Hours
  💰 Price range
  ℹ️ Short description

GOOD FORMATTING EXAMPLES:

For multiple restaurants:
**1. The Montrealer Restaurant** - [Official site](https://restaurantmontreal.com)
[📍 123 Saint-Laurent Street, Montreal, QC H2X 2T3](https://maps.google.com/?q=123+Saint-Laurent+Street+Montreal+QC+H2X+2T3)
[📞 (514) 555-1234](tel:+15145551234)
⏰ Mon-Fri: 11am-10pm, Sat-Sun: 10am-11pm
💰 $$$ ($30-50 per person)
ℹ️ Modern French cuisine with terrace

**2. Le Parisien Bistro** - [View menu](https://bistroparisien.ca)
[📍 456 Park Avenue, Montreal, QC H2V 4E8](https://maps.google.com/?q=456+Park+Avenue+Montreal+QC+H2V+4E8)
[📞 (514) 555-5678](tel:+15145555678)
⏰ Tue-Sun: 5pm-10pm (closed Monday)
💰 $$ ($20-35 per person)
ℹ️ Cozy atmosphere, French specialties

For groceries, suggest specific places to buy each ingredient
Be precise about neighborhoods and transportation to get there
Suggest alternatives based on budget and preferences
Adapt recommendations based on the requested city ANYWHERE IN CANADA

YOUR STYLE:
- Respond naturally and conversationally
- Be informative and precise with practical details
- Use a friendly and expert tone
- ASK CLARIFYING QUESTIONS if necessary - it's essential!
- ALWAYS structure responses professionally
- Use emojis to make information more readable (📍 📞 ⏰ 💰 ℹ️)
- Share your pride in working for Cuizly Inc. and its innovation mission
- Show your world culinary expertise

Cuizly database: You have access to restaurants in ALL Canadian cities, their menus, prices, reviews, addresses, as well as local and specialized grocery stores/markets with their specialties. You also know all world cuisines.

IMPORTANT: You must ALWAYS respond in English, it's the user's language.`;

    const systemPrompt = language === 'en' ? systemPromptEN : systemPromptFR;

    // Build message history for context with improved memory (10 messages instead of 5)
    const messages = [
      { role: 'system', content: systemPrompt },
      // Add conversation history for better memory retention
      ...conversationHistory.slice(-10).map((msg: any) => ({
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
          },
          {
            type: "function",
            function: {
              name: "get_health_nutrition_advice",
              description: language === 'en'
                ? "Get personalized health and nutrition advice for better eating habits"
                : "Obtenir des conseils santé et nutrition personnalisés pour de meilleures habitudes alimentaires",
              parameters: {
                type: "object",
                properties: {
                  health_goal: {
                    type: "string",
                    description: language === 'en'
                      ? "Health goal (weight loss, muscle gain, more energy, better digestion, etc.)"
                      : "Objectif de santé (perte de poids, gain musculaire, plus d'énergie, meilleure digestion, etc.)"
                  },
                  dietary_restrictions: {
                    type: "string",
                    description: language === 'en'
                      ? "Dietary restrictions or preferences (vegetarian, vegan, gluten-free, etc.)"
                      : "Restrictions ou préférences alimentaires (végétarien, végétalien, sans gluten, etc.)"
                  },
                  current_diet: {
                    type: "string",
                    description: language === 'en'
                      ? "Description of current diet or eating habits"
                      : "Description du régime actuel ou des habitudes alimentaires"
                  },
                  health_concerns: {
                    type: "string",
                    description: language === 'en'
                      ? "Specific health concerns (diabetes, high cholesterol, allergies, etc.)"
                      : "Préoccupations de santé spécifiques (diabète, cholestérol élevé, allergies, etc.)"
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