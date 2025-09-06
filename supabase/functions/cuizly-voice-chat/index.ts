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

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionId: string | null = null;

  socket.onopen = () => {
    console.log("Client WebSocket connection opened");
    
    // Connect to OpenAI Realtime API
    openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", [
      "realtime",
      `Bearer.${Deno.env.get('OPENAI_API_KEY')}`
    ]);

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      socket.send(JSON.stringify({
        type: 'connection',
        status: 'connected'
      }));
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received from OpenAI:", data.type);

        // Handle session creation
        if (data.type === 'session.created') {
          sessionId = data.session.id;
          console.log("Session created:", sessionId);
          
          // Send session update with Cuizly-specific configuration
          openAISocket?.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ["text", "audio"],
              instructions: `Tu es l'assistant vocal de Cuizly, l'application de recommandations de restaurants à Montréal. Tu peux aider les utilisateurs à:

1. Rechercher des restaurants par cuisine, prix, localisation
2. Naviguer dans l'application Cuizly
3. Gérer leurs favoris et préférences
4. Obtenir des recommandations personnalisées

Commandes que tu peux comprendre:
- "Trouve-moi un restaurant italien pas cher"
- "Quelles sont les offres du jour?"
- "Montre mes favoris"
- "Ajoute ce restaurant à ma liste"
- "Change mes préférences"

Réponds toujours en français et sois naturel et amical. Si tu ne peux pas effectuer une action, explique ce que l'utilisateur peut faire.`,
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              tools: [
                {
                  type: "function",
                  name: "search_restaurants",
                  description: "Rechercher des restaurants avec des critères spécifiques",
                  parameters: {
                    type: "object",
                    properties: {
                      cuisine: { type: "string", description: "Type de cuisine" },
                      price_range: { type: "string", description: "Gamme de prix (low, medium, high)" },
                      location: { type: "string", description: "Localisation ou quartier" }
                    }
                  }
                },
                {
                  type: "function", 
                  name: "show_favorites",
                  description: "Afficher les restaurants favoris de l'utilisateur",
                  parameters: {
                    type: "object",
                    properties: {}
                  }
                },
                {
                  type: "function",
                  name: "add_to_favorites", 
                  description: "Ajouter un restaurant aux favoris",
                  parameters: {
                    type: "object",
                    properties: {
                      restaurant_name: { type: "string", description: "Nom du restaurant" }
                    },
                    required: ["restaurant_name"]
                  }
                },
                {
                  type: "function",
                  name: "show_offers",
                  description: "Afficher les offres et promotions disponibles",
                  parameters: {
                    type: "object", 
                    properties: {}
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.8,
              max_response_output_tokens: "inf"
            }
          }));
        }

        // Handle function calls
        if (data.type === 'response.function_call_arguments.done') {
          console.log("Function call:", data.name, data.arguments);
          
          let result = "";
          switch (data.name) {
            case 'search_restaurants':
              const args = JSON.parse(data.arguments);
              result = `Je vais chercher des restaurants ${args.cuisine || ''} ${args.price_range ? 'dans la gamme ' + args.price_range : ''} ${args.location ? 'à ' + args.location : ''}. Voici mes recommandations...`;
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'search_restaurants',
                data: args
              }));
              break;
              
            case 'show_favorites':
              result = "Voici vos restaurants favoris...";
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'show_favorites'
              }));
              break;
              
            case 'add_to_favorites':
              const favArgs = JSON.parse(data.arguments);
              result = `J'ai ajouté ${favArgs.restaurant_name} à vos favoris!`;
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'add_to_favorites',
                data: favArgs
              }));
              break;
              
            case 'show_offers':
              result = "Voici les meilleures offres disponibles aujourd'hui...";
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'show_offers'
              }));
              break;
              
            default:
              result = "Action effectuée!";
          }

          // Send function result back to OpenAI
          openAISocket?.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: data.call_id,
              output: result
            }
          }));
        }

        // Forward all messages to client
        socket.send(event.data);
        
      } catch (error) {
        console.error("Error processing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Erreur de connexion avec le service vocal'
      }));
    };

    openAISocket.onclose = () => {
      console.log("OpenAI WebSocket connection closed");
      socket.send(JSON.stringify({
        type: 'connection',
        status: 'disconnected'
      }));
    };
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received from client:", data.type);
      
      // Forward client messages to OpenAI
      if (openAISocket?.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket connection closed");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});