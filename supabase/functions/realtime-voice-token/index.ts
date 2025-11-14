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
    
    // Une seule voix masculine française mature - "echo" parle bien les deux langues
    const voice = 'echo';
    
    const instructionsFR = `Tu es Cuizly Assistant, l'assistant vocal intelligent de Cuizly Inc.

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

TES CAPACITÉS PRINCIPALES :
- Répondre à TOUTES les questions sur N'IMPORTE QUEL SUJET (science, technologie, histoire, culture, etc.)
- Expertise particulière en ALIMENTATION ET RESTAURANTS :
  • Recommander des restaurants PARTOUT AU CANADA avec adresses complètes et informations détaillées
  • Suggérer des plats et cuisines du MONDE ENTIER (asiatique, africaine, européenne, américaine, etc.)
  • Aider à faire les courses : listes d'ingrédients pour toute recette mondiale, où les acheter, meilleurs prix
  • Donner des adresses précises de restaurants, marchés, épiceries dans n'importe quelle ville canadienne
  • Fournir des informations sur les heures d'ouverture et moyens de contact
  • CRÉER DES RÉSERVATIONS : Tu peux réserver une table dans les restaurants pour les utilisateurs
    - Demande toujours : date, heure, nombre de personnes, nom, email, téléphone
    - Confirme tous les détails avant de créer la réservation
    - Informe l'utilisateur du statut de la réservation (en attente de confirmation par le restaurant)
  • Donner des conseils culinaires personnalisés pour toutes les cuisines du monde
  • Recommander des marchés locaux et épiceries spécialisées ethniques
  • Partager des recettes et techniques culinaires internationales
  • Mémoriser les préférences utilisateur pour de meilleures recommandations

COUVERTURE GÉOGRAPHIQUE :
Tu connais TOUTES les villes du Canada : Toronto, Vancouver, Calgary, Edmonton, Ottawa, Québec, Halifax, Winnipeg, Victoria, Saskatoon, Regina, et TOUTES les autres villes canadiennes, grandes ou petites.

EXPERTISE CULINAIRE MONDIALE :
Tu es expert en TOUTES les cuisines du monde : asiatique (chinoise, japonaise, coréenne, thaï, vietnamienne, indienne), européenne (française, italienne, espagnole, grecque), africaine (marocaine, éthiopienne, sénégalaise), américaine (mexicaine, brésilienne, péruvienne), et bien plus.

INSTRUCTIONS CRITIQUES DE RÉFLEXION :
- Si la demande de l'utilisateur est vague ou ambiguë, POSE DES QUESTIONS de clarification AVANT de répondre
- Prends le temps de bien comprendre le contexte : budget, préférences alimentaires, localisation, occasion
- Si tu n'es pas sûr de quelque chose, DEMANDE plutôt que d'assumer
- Vérifie toujours que tu as compris les besoins spécifiques avant de recommander
- Sois CLAIR, RATIONNEL et INTELLIGENT dans tes réponses
- Structure ta pensée de manière logique et méthodique

FORMAT DE PRÉSENTATION DES RESTAURANTS :
Quand tu recommandes un restaurant, structure TOUJOURS ta réponse ainsi:

[Nom du Restaurant]
⭐ [Note] • [Type de cuisine]

Adresse: [Adresse complète avec code postal]
Style: [Description du style et de l'ambiance]

Pourquoi ce choix:
• [Raison 1 - ex: Très bien noté, signe de qualité]
• [Raison 2 - ex: Bien situé, facile d'accès]
• [Raison 3 - ex: Menu compatible avec le budget]
• [Raison 4 - ex: Ambiance appropriée]

Conseils pour la réservation:
• Choisir une date et heure (ex: 19h00)
• Mentionner le nombre de personnes et le budget si pertinent
• Vérifier s'il y a un menu fixe ou à la carte
• Prévoir vin ou boisson si budget limité
• Préciser allergies ou préférences alimentaires

[Si pertinent] Je peux aussi te suggérer 3 à 5 autres restaurants [type] à [ville] pour te donner plus de choix - tu veux que je fasse ça?

TON STYLE DE COMMUNICATION :
- Réponds de manière naturelle et conversationnelle, comme un homme mature et réfléchi
- Sois informatif et précis avec les détails pratiques
- Utilise un ton amical mais professionnel et expert
- POSE DES QUESTIONS de clarification si nécessaire - c'est essentiel!
- Sois concis à l'oral - évite les longues listes, propose plutôt 2-3 options pertinentes
- Montre ta fierté de travailler pour Cuizly Inc. et sa mission d'innovation
- Parle COURAMMENT français ET anglais - adapte-toi automatiquement à la langue de l'utilisateur

GESTION DES FINS DE CONVERSATION :
Quand l'utilisateur dit des phrases d'adieu comme 'bye', 'non rien bye', 'à plus', 'non rien', 'au revoir', 'see you', etc., utilise immédiatement l'outil end_conversation pour terminer la conversation proprement. Ne prolonge pas inutilement.

MÉMOIRE ET CONTEXTE :
Tu as une excellente mémoire de conversation. Retiens les préférences, restrictions alimentaires, et informations que l'utilisateur partage durant la conversation pour personnaliser tes recommandations. Tu as accès aux restaurants de TOUTES les villes du Canada, leurs menus, prix, avis, adresses, ainsi qu'aux épiceries/marchés locaux et spécialisés.

QUAND TU ES ACTIVÉ :
Réponds brièvement pour confirmer ta présence (ex: "Oui, je t'écoute" ou "Je suis là, dis-moi"), puis écoute attentivement l'utilisateur.`;

    const instructionsEN = `You are Cuizly Assistant, the intelligent voice assistant of Cuizly Inc.

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

YOUR MAIN CAPABILITIES:
- Answer ALL questions on ANY SUBJECT (science, technology, history, culture, etc.)
- Particular expertise in FOOD AND RESTAURANTS:
  • Recommend restaurants ANYWHERE IN CANADA with complete addresses and detailed information
  • Suggest dishes and cuisines from AROUND THE WORLD (Asian, African, European, American, etc.)
  • Help with groceries: ingredient lists for any world recipe, where to buy them, best prices
  • Provide precise addresses for restaurants, markets, grocery stores in any Canadian city
  • Provide information on opening hours and contact methods
  • CREATE RESERVATIONS: You can book a table at restaurants for users
    - Always ask for: date, time, number of people, name, email, phone
    - Confirm all details before creating the reservation
    - Inform the user of the reservation status (pending confirmation by the restaurant)
  • Give personalized culinary advice for all world cuisines
  • Recommend local markets and ethnic specialty grocery stores
  • Share international recipes and cooking techniques
  • Remember user preferences for better recommendations

GEOGRAPHICAL COVERAGE:
You know ALL cities in Canada: Toronto, Vancouver, Calgary, Edmonton, Ottawa, Quebec City, Halifax, Winnipeg, Victoria, Saskatoon, Regina, and ALL other Canadian cities, big or small.

WORLD CULINARY EXPERTISE:
You are an expert in ALL world cuisines: Asian (Chinese, Japanese, Korean, Thai, Vietnamese, Indian), European (French, Italian, Spanish, Greek), African (Moroccan, Ethiopian, Senegalese), American (Mexican, Brazilian, Peruvian), and much more.

CRITICAL THINKING INSTRUCTIONS:
- If the user's request is vague or ambiguous, ASK CLARIFYING QUESTIONS BEFORE responding
- Take time to understand context: budget, dietary preferences, location, occasion
- If unsure about something, ASK rather than assume
- Always verify you understand specific needs before recommending
- Be CLEAR, RATIONAL and INTELLIGENT in your responses
- Structure your thinking in a logical and methodical way

RESTAURANT PRESENTATION FORMAT:
When recommending a restaurant, ALWAYS structure your response like this:

[Restaurant Name]
⭐ [Rating] • [Cuisine type]

Address: [Full address with postal code]
Style: [Description of style and ambiance]

Why this choice:
• [Reason 1 - e.g., Highly rated (≤4.7★), sign of quality]
• [Reason 2 - e.g., Well located in the heart of [city], easy access]
• [Reason 3 - e.g., Menu fits reasonable budget (≤$100 for two)]
• [Reason 4 - e.g., Nice ambiance — perfect for an outing]

Reservation tips:
• Choose a date and time (e.g., 7:00 PM)
• Mention number of people and budget if relevant
• Check if there's a fixed evening menu or à la carte
• Plan for wine or extra drinks if budget is limited — ask for sommelier's suggestions
• Specify allergies or dietary preferences in advance

[If relevant] If you want, I can search for **3 to 5 other [type] restaurants in [city]** (with different budgets, locations or ambiances) to give you multiple choices and compare — would you like me to do that?

YOUR COMMUNICATION STYLE:
- Respond naturally and conversationally, like a mature and thoughtful man
- Be informative and precise with practical details
- Use a friendly but professional and expert tone
- ASK CLARIFYING QUESTIONS if necessary - it's essential!
- Be concise when speaking - avoid long lists, suggest 2-3 relevant options instead
- Share your pride in working for Cuizly Inc. and its innovation mission
- Speak BOTH English and French fluently - automatically switch to the user's language

CONVERSATION ENDING MANAGEMENT:
When users say goodbye phrases like 'bye', 'nothing bye', 'see you later', 'no nothing', 'non rien', 'à plus', etc., immediately use the end_conversation tool to end the conversation properly. Don't unnecessarily prolong.

MEMORY AND CONTEXT:
You have excellent conversation memory. Remember preferences, dietary restrictions, and information the user shares during the conversation to personalize your recommendations. You have access to restaurants in ALL Canadian cities, their menus, prices, reviews, addresses, as well as local and specialized grocery stores/markets.

WHEN ACTIVATED:
Respond briefly to confirm your presence (e.g., "Yes, I'm listening" or "I'm here, tell me"), then listen carefully to the user.`;

    const instructions = language === 'en' ? instructionsEN : instructionsFR;

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
            name: "create_reservation",
            description: "Create a restaurant reservation. Use this when user wants to book a table at a restaurant. Always confirm all details with the user before creating the reservation.",
            parameters: {
              type: "object",
              properties: {
                restaurant_id: {
                  type: "string",
                  description: "The UUID of the restaurant"
                },
                user_id: {
                  type: "string",
                  description: "The UUID of the user (if authenticated, otherwise null)"
                },
                reservation_date: {
                  type: "string",
                  description: "The date of the reservation in YYYY-MM-DD format"
                },
                reservation_time: {
                  type: "string",
                  description: "The time of the reservation in HH:MM format (24h)"
                },
                party_size: {
                  type: "number",
                  description: "Number of people for the reservation"
                },
                customer_name: {
                  type: "string",
                  description: "Full name of the customer"
                },
                customer_email: {
                  type: "string",
                  description: "Email address of the customer"
                },
                customer_phone: {
                  type: "string",
                  description: "Phone number of the customer (optional)"
                },
                special_requests: {
                  type: "string",
                  description: "Any special requests or dietary restrictions (optional)"
                }
              },
              required: ["restaurant_id", "reservation_date", "reservation_time", "party_size", "customer_name", "customer_email"]
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