import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  console.log("WebSocket connection established");
  
  let openAISocket: WebSocket | null = null;
  let sessionCreated = false;

  socket.onopen = () => {
    console.log("Client WebSocket opened");
    
    // Connect to OpenAI Realtime API
    openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("OpenAI message:", data.type);
        
        // Handle session creation
        if (data.type === 'session.created' && !sessionCreated) {
          sessionCreated = true;
          
          // Send session configuration
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: "Tu es Cuizly, un assistant culinaire expert de Montréal. Tu aides les utilisateurs à découvrir des restaurants, obtenir des recommandations personnalisées et des conseils culinaires. Réponds naturellement en français québécois avec enthousiasme pour la gastronomie montréalaise.",
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              tools: [
                {
                  type: 'function',
                  name: 'get_restaurant_recommendations',
                  description: 'Obtenir des recommandations de restaurants à Montréal',
                  parameters: {
                    type: 'object',
                    properties: {
                      cuisine: { type: 'string' },
                      location: { type: 'string' },
                      budget: { type: 'string' }
                    },
                    required: ['cuisine']
                  }
                }
              ],
              tool_choice: 'auto',
              temperature: 0.8,
              max_response_output_tokens: 'inf'
            }
          };
          
          openAISocket?.send(JSON.stringify(sessionConfig));
          console.log("Session configuration sent");
        }
        
        // Forward message to client
        socket.send(event.data);
      } catch (error) {
        console.error("Error processing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Connection to AI service failed'
      }));
    };

    openAISocket.onclose = () => {
      console.log("OpenAI WebSocket closed");
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Client message:", data.type);
      
      // Forward client messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
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