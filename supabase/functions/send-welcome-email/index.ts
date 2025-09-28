import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple HTML template function
function createWelcomeEmailHTML(userName: string, userType: 'consumer' | 'restaurant_owner', loginUrl: string) {
  const isConsumer = userType === 'consumer';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue chez Cuizly !</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF6B35; margin-bottom: 10px;">Bienvenue chez Cuizly !</h1>
          <p style="font-size: 18px; color: #666;">
            ${isConsumer ? 'Découvrez Montréal autrement' : 'Bienvenue parmi nos partenaires restaurateurs'}
          </p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <p>Bonjour <strong>${userName}</strong>,</p>
          
          ${isConsumer ? `
            <p>Nous sommes ravis de vous accueillir dans la communauté Cuizly ! Vous allez pouvoir :</p>
            <ul style="margin: 20px 0;">
              <li>🍽️ Découvrir les meilleurs restaurants de Montréal</li>
              <li>💰 Profiter d'offres exclusives</li>
              <li>⭐ Lire et partager des avis authentiques</li>
              <li>🎯 Recevoir des recommandations personnalisées</li>
            </ul>
          ` : `
            <p>Nous sommes ravis de vous compter parmi nos partenaires restaurateurs ! Avec Cuizly, vous pourrez :</p>
            <ul style="margin: 20px 0;">
              <li>📈 Augmenter votre visibilité</li>
              <li>🎯 Attirer de nouveaux clients</li>
              <li>💼 Gérer vos offres facilement</li>
              <li>📊 Suivre vos performances</li>
            </ul>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              ${isConsumer ? 'Commencer à explorer' : 'Accéder à mon tableau de bord'}
            </a>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #999;">
          <p>Si vous avez des questions, n'hésitez pas à nous contacter !</p>
          <p>© 2024 Cuizly - Découvrez Montréal autrement</p>
        </div>
      </body>
    </html>
  `;
}

interface WelcomeEmailRequest {
  email: string;
  userName: string;
  userType: 'consumer' | 'restaurant_owner';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, userType }: WelcomeEmailRequest = await req.json();

    const loginUrl = 'https://www.cuizly.ca/auth';

    // Render the React email template
    const html = createWelcomeEmailHTML(userName, userType, loginUrl);

    const emailResponse = await resend.emails.send({
      from: "Cuizly <Cuizlycanada@gmail.com>",
      to: [email],
      subject: userType === 'consumer' 
        ? "Bienvenue chez Cuizly - Découvrez Montréal autrement !" 
        : "Bienvenue parmi nos partenaires restaurateurs !",
      html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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