import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSVerificationRequest {
  phone: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, language = 'fr' }: SMSVerificationRequest = await req.json();

    console.log('SMS verification request for phone:', phone);

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Format de numéro de téléphone invalide' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code with expiration (you might want to use a database for this)
    const codeData = {
      code: verificationCode,
      phone: phone,
      expires: Date.now() + (5 * 60 * 1000), // 5 minutes
      verified: false
    };

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || '+1234567890'; // You'll need to add this

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Configuration manquante pour l\'envoi de SMS' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare SMS message based on language
    const messages = {
      fr: `Votre code de vérification Cuizly : ${verificationCode}. Code valide pendant 5 minutes.`,
      en: `Your Cuizly verification code: ${verificationCode}. Valid for 5 minutes.`
    };

    const message = messages[language as keyof typeof messages] || messages.fr;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = btoa(`${accountSid}:${authToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: message,
      }),
    });

    if (!twilioResponse.ok) {
      const error = await twilioResponse.text();
      console.error('Twilio error:', error);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'envoi du SMS' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const twilioResult = await twilioResponse.json();
    console.log('SMS sent successfully:', twilioResult.sid);

    // In a real implementation, you'd store the verification code in a database
    // For now, we'll return a session token that includes the code data
    const sessionToken = btoa(JSON.stringify(codeData));

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionToken,
        message: 'Code de vérification envoyé par SMS'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-sms-verification function:', error);
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