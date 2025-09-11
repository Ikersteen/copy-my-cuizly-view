import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction utilitaire pour convertir en base64 par chunks
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768; // 32KB chunks pour éviter les problèmes de mémoire
  let result = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    result += btoa(String.fromCharCode(...chunk));
  }
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "Charlie", language = "fr" } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Voice ID mapping pour français québécois et anglais
    const voiceIds = {
      // Voix pour français québécois (plus naturelles et chaleureuses)
      "Charlie": "IKne3meq5aSn9XLyUdCD", // Excellent pour québécois masculin
      "River": "SAz9YHcvj6GT2YYXdXww",   // Bon pour québécois féminin
      "Liam": "TX3LPaxmHKxFdv7VOQHJ",    // Alternative masculine
      "Charlotte": "XB0fDUnXU5powFXDhCwa", // Alternative féminine
      
      // Voix pour anglais (fallback)
      "Aria": "9BWtsMINqrJLrRacOk9x",
      "Roger": "CwhRBWXzGAHq8TQ4Fs17", 
      "Sarah": "EXAVITQu4vr4xnSDxMaL",
      "Laura": "FGY2WhTYpPnrIDTdsKH5",
      "George": "JBFqnCBsd6RMkjVDRZzb",
      "Alice": "Xb7hH8MSUJpSbSDYk0k2"
    };

    // Sélection de voix selon la langue
    let selectedVoice = voice;
    if (language === 'fr') {
      // Prioriser les voix québécoises pour le français
      selectedVoice = voice === "Aria" ? "Charlie" : voice; 
    } else if (language === 'en') {
      // Utiliser des voix anglaises naturelles
      selectedVoice = voice === "Charlie" ? "Aria" : voice;
    }

    const voiceId = voiceIds[selectedVoice as keyof typeof voiceIds] || voiceIds.Charlie;

    console.log(`🇫🇷🇬🇧 Generating ${language} speech with voice ${selectedVoice} (${voiceId})`);
    console.log(`📝 Text preview: "${text.substring(0, 100)}..."`);

    // Configuration optimisée selon la langue
    const voiceSettings = language === 'fr' ? {
      stability: 0.4,        // Plus d'expression naturelle
      similarity_boost: 0.8, // Garde l'accent québécois
      style: 0.2,           // Un peu de style pour naturalité
      use_speaker_boost: true
    } : {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2", // Supporte français et anglais
        voice_settings: voiceSettings
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    // Convert audio to base64 avec gestion mémoire améliorée
    const arrayBuffer = await response.arrayBuffer();
    console.log(`📊 Audio size: ${arrayBuffer.byteLength} bytes`);
    
    const base64Audio = arrayBufferToBase64(arrayBuffer);

    console.log('✅ Speech generated successfully');
    console.log(`📤 Base64 length: ${base64Audio.length}`);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ Error in cuizly-voice-elevenlabs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});