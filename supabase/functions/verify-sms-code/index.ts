import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyCodeRequest {
  sessionToken: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken, code }: VerifyCodeRequest = await req.json();

    console.log('SMS code verification request');

    if (!sessionToken || !code) {
      return new Response(
        JSON.stringify({ error: 'Token de session et code requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Decode session token
    let codeData;
    try {
      codeData = JSON.parse(atob(sessionToken));
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Token de session invalide' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if code has expired
    if (Date.now() > codeData.expires) {
      return new Response(
        JSON.stringify({ error: 'Code de vérification expiré' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if code matches
    if (code !== codeData.code) {
      return new Response(
        JSON.stringify({ error: 'Code de vérification incorrect' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark as verified
    codeData.verified = true;
    const updatedToken = btoa(JSON.stringify(codeData));

    console.log('SMS verification successful for phone:', codeData.phone);

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        phone: codeData.phone,
        sessionToken: updatedToken,
        message: 'Numéro de téléphone vérifié avec succès'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in verify-sms-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);