import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🎤 Cuizly Voice ElevenLabs - ${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    const { text, voice = "Charlie", language = "fr" } = body;
    
    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Voice ID pour Charlie (québécois)
    const voiceId = "IKne3meq5aSn9XLyUdCD";
    
    console.log(`🗣️  Generating speech for: "${text.substring(0, 50)}..."`);
    console.log(`🎭 Using voice: ${voice} (${voiceId})`);

    // Appel à l'API ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      }),
    });

    console.log(`📊 ElevenLabs response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Conversion en base64
    const arrayBuffer = await response.arrayBuffer();
    console.log(`📦 Audio buffer size: ${arrayBuffer.byteLength} bytes`);
    
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    console.log(`✅ Speech generated successfully! Base64 length: ${base64Audio.length}`);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        success: true,
        voiceUsed: voice,
        textLength: text.length
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
    
  } catch (error) {
    console.error('❌ Function error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
  }
});