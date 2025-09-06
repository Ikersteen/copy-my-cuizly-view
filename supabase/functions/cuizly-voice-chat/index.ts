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

  // Always upgrade to WebSocket first
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Check if OpenAI API key is available after WebSocket upgrade
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  let openAISocket: WebSocket | null = null;
  let sessionId: string | null = null;

  socket.onopen = () => {
    console.log("Client WebSocket connection opened");
    
    // Check if OpenAI API key is available
    if (!openaiKey) {
      console.error('OpenAI API key not found');
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Clé API OpenAI non configurée. Contactez le support.'
      }));
      socket.close(1011, 'OpenAI API key not configured');
      return;
    }
    
    try {
      // Connect to OpenAI Realtime API with the correct model
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", [
        "realtime",
        `Bearer.${openaiKey}`
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
              instructions: `Tu es l'assistant vocal de Cuizly, une application de recommandations de restaurants à Montréal.

Ton rôle : Aider les utilisateurs à découvrir des restaurants selon leurs préférences, gérer leurs favoris, et répondre aux questions sur la cuisine montréalaise.

Personnalité :
- Convivial et enthousiaste pour la gastronomie
- Parle en français avec un ton chaleureux
- Expert de la scène culinaire montréalaise
- Pratique et efficace dans tes recommandations

Capacités principales avec outils :
1. Rechercher des restaurants avec get_recommendations
2. Ajouter aux favoris avec add_to_favorites
3. Consulter les préférences avec get_user_preferences
4. Afficher les favoris avec show_favorites

Directives importantes :
- Réponds toujours en français
- Sois concis mais informatif
- Utilise les outils pour réaliser les actions demandées
- Confirme les actions effectuées

Exemples d'interactions :
- "Trouve-moi un bon restaurant italien pas cher" → utilise get_recommendations
- "Ajoute ce restaurant à mes favoris" → utilise add_to_favorites
- "Quelles sont mes préférences ?" → utilise get_user_preferences
- "Montre mes favoris" → utilise show_favorites`,
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
                  name: "get_recommendations",
                  description: "Obtenir des recommandations de restaurants selon des critères spécifiques",
                  parameters: {
                    type: "object",
                    properties: {
                      cuisine: { 
                        type: "string", 
                        description: "Type de cuisine recherché (ex: italienne, japonaise, française)" 
                      },
                      price_range: { 
                        type: "string", 
                        description: "Gamme de prix ($, $$, $$$, $$$$)" 
                      },
                      dietary_restrictions: {
                        type: "array",
                        items: { type: "string" },
                        description: "Restrictions alimentaires (ex: végétarien, végan, sans gluten)"
                      },
                      location_preference: {
                        type: "string",
                        description: "Préférence de localisation ou quartier"
                      }
                    }
                  }
                },
                {
                  type: "function", 
                  name: "add_to_favorites",
                  description: "Ajouter un restaurant aux favoris de l'utilisateur",
                  parameters: {
                    type: "object",
                    properties: {
                      restaurantId: { 
                        type: "string", 
                        description: "ID du restaurant à ajouter" 
                      },
                      restaurantName: {
                        type: "string",
                        description: "Nom du restaurant pour confirmation"
                      }
                    },
                    required: ["restaurantId"]
                  }
                },
                {
                  type: "function",
                  name: "get_user_preferences", 
                  description: "Consulter les préférences alimentaires et critères de l'utilisateur",
                  parameters: {
                    type: "object",
                    properties: {}
                  }
                },
                {
                  type: "function",
                  name: "show_favorites",
                  description: "Afficher la liste des restaurants favoris de l'utilisateur",
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
            case 'get_recommendations':
              const args = JSON.parse(data.arguments);
              result = `Je recherche des restaurants ${args.cuisine || 'variés'} ${args.price_range ? 'dans la gamme ' + args.price_range : ''} ${args.location_preference ? 'à ' + args.location_preference : ''}...`;
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'get_recommendations',
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
              result = `J'ajoute ${favArgs.restaurantName || 'ce restaurant'} à vos favoris!`;
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'add_to_favorites',
                data: favArgs
              }));
              break;
              
            case 'get_user_preferences':
              result = "Voici vos préférences actuelles...";
              socket.send(JSON.stringify({
                type: 'cuizly_action',
                action: 'get_user_preferences'
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
          message: 'Erreur de connexion avec le service vocal OpenAI'
        }));
      };

      openAISocket.onclose = (closeEvent) => {
        console.log("OpenAI WebSocket connection closed", closeEvent.code, closeEvent.reason);
        socket.send(JSON.stringify({
          type: 'connection',
          status: 'disconnected'
        }));
      };
    } catch (error) {
      console.error("Failed to connect to OpenAI:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Impossible de se connecter au service OpenAI'
      }));
    }
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