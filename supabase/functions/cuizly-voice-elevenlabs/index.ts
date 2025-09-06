import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptionRequest {
  audio: string; // base64 encoded audio
  userContext?: {
    preferences?: any;
    address?: string;
    favorites?: string[];
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, userContext }: TranscriptionRequest = await req.json()
    
    if (!audio) {
      throw new Error('Audio data is required')
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY')

    if (!openaiKey || !elevenlabsKey) {
      throw new Error('API keys not configured')
    }

    console.log('Processing voice request...')
    console.log('User context:', userContext)

    // Step 1: Transcribe audio using OpenAI Whisper
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0))
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'fr')

    console.log('Transcribing audio...')
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!transcriptionResponse.ok) {
      throw new Error(`Whisper API error: ${await transcriptionResponse.text()}`)
    }

    const { text: userMessage } = await transcriptionResponse.json()
    console.log('Transcribed text:', userMessage)

    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('No speech detected')
    }

    // Step 2: Process with ChatGPT
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Tu es Cuizly, un assistant vocal intelligent pour une plateforme de recommandations de restaurants à Montréal. Tu peux:

1. Recommander des restaurants basés sur les préférences utilisateur
2. Ajouter des restaurants aux favoris
3. Répondre aux questions sur les restaurants
4. Aider avec la navigation sur l'app

Contexte utilisateur: ${JSON.stringify(userContext)}

Instructions:
- Réponds en français de manière naturelle et conversationnelle
- Sois concis mais informatif
- Si l'utilisateur demande des recommandations, utilise la fonction get_recommendations
- Si l'utilisateur veut ajouter un favori, utilise la fonction add_to_favorites
- Garde un ton amical et professionnel`
      },
      {
        role: 'user',
        content: userMessage
      }
    ]

    console.log('Processing with ChatGPT...')
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!chatResponse.ok) {
      throw new Error(`ChatGPT API error: ${await chatResponse.text()}`)
    }

    const chatResult = await chatResponse.json()
    const assistantResponse = chatResult.choices[0]?.message?.content

    if (!assistantResponse) {
      throw new Error('No response from ChatGPT')
    }

    console.log('ChatGPT response:', assistantResponse)

    // Step 3: Convert to speech using ElevenLabs
    console.log('Converting to speech with ElevenLabs...')
    const speechResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${elevenlabsKey}`,
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsKey,
      },
      body: JSON.stringify({
        text: assistantResponse,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      }),
    })

    if (!speechResponse.ok) {
      const errorText = await speechResponse.text()
      console.error('ElevenLabs error:', errorText)
      throw new Error(`ElevenLabs API error: ${errorText}`)
    }

    // Convert audio to base64
    const audioArrayBuffer = await speechResponse.arrayBuffer()
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioArrayBuffer))
    )

    console.log('Voice processing completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        transcription: userMessage,
        response: assistantResponse,
        audioContent: base64Audio,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Voice processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})