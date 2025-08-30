import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistConfirmationRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WaitlistConfirmationRequest = await req.json();
    
    console.log(`Sending waitlist confirmation email to: ${email}, Name: ${name}`);

    // SendGrid API configuration
    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendGridApiKey) {
      throw new Error("SendGrid API key not configured");
    }

    // HTML email content with dynamic name replacement
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur la liste d'attente - Cuizly Analytics+</title>
</head>
<body style="background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="margin: 0 auto; padding: 40px 20px; max-width: 600px;">
        
        <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://www.cuizly.ca" style="text-decoration: none;">
                <img src="https://www.cuizly.ca/lovable-uploads/db9c9936-605a-4c88-aa46-6154a944bb5c.png" 
                     width="120" 
                     height="40" 
                     alt="Cuizly" 
                     style="margin: 0 auto;" />
            </a>
        </div>

        <h1 style="color: #171717; font-size: 28px; font-weight: 700; text-align: center; margin: 0 0 30px 0; line-height: 1.3;">
            🎉 Bienvenue sur la liste d'attente Cuizly Analytics+ !
        </h1>

        <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Bonjour ${name},
        </p>

        <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Merci de vous être inscrit(e) à la liste d'attente Cuizly Analytics+ ! 
            Vous faites désormais partie des premiers à découvrir les fonctionnalités avancées et exclusives de Cuizly à travers Cuizly Analytics+.
        </p>

        <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Nous vous tiendrons informé(e) de votre accès dès le lancement officiel. 
            En attendant, restez à l'affût de nos nouveautés !
        </p>

        <div style="background-color: #fafafa; padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #e5e5e5;">
            <p style="color: #171717; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>Ce que vous pourrez faire avec Cuizly Analytics+ :</strong>
            </p>
            
            <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">• Rapports anonymisés détaillés</p>
            <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">• Analyses des tendances de consommation</p>
            <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">• Aperçus précis sur les performances par segment</p>
            <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">• Recommandations IA pour votre business</p>
        </div>

        <!-- Security notice -->
        <div style="background-color:#fafafa;padding:20px;border-radius:12px;margin:30px 0;border:1px solid #e5e5e5">
            <p style="color:#525252;font-size:14px;line-height:1.6;margin:0">
                <strong>Sécurité :</strong> Si vous n'avez pas créé cette inscription, vous pouvez simplement ignorer ce courriel.
            </p>
        </div>

        <p style="color:#171717;font-weight:700;text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e5e5">
            L'équipe CUIZLY
        </p>

        <p style="color:#737373; font-size: 12px; text-align: center; margin-top: 10px; margin-bottom: 0;">
            <a href="https://www.linkedin.com/company/cuizly" target="_blank" style="color:#171717; text-decoration:none; font-weight:600;">
                LinkedIn
            </a>
            |
            <a href="https://www.instagram.com/cuizly" target="_blank" style="color:#171717; text-decoration:none; font-weight:600;">
                Instagram
            </a>
        </p>
    </div>
</body>
</html>`;

    // Send email via SendGrid API
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
            subject: "🎉 Bienvenue sur la liste d'attente Cuizly Analytics+",
          },
        ],
        from: { 
          email: "noreply@cuizly.ca", 
          name: "Cuizly"
        },
        content: [
          {
            type: "text/html",
            value: emailHtml,
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorBody = await sendGridResponse.text();
      console.error("SendGrid error:", errorBody);
      throw new Error(`SendGrid API error: ${sendGridResponse.status} - ${errorBody}`);
    }

    console.log("Waitlist confirmation email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-waitlist-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);