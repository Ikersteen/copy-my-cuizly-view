import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userType, userEmail, dashboardUrl } = await req.json();

    // Generate HTML email
    const html = createWelcomeEmailHTML(userName, userType, dashboardUrl);

    const { error } = await resend.emails.send({
      from: "Cuizly <welcome@cuizly.ca>",
      to: [userEmail],
      subject: "Bienvenue sur Cuizly !",
      html,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function createWelcomeEmailHTML(userName: string, userType: 'consumer' | 'restaurant_owner', dashboardUrl?: string) {
  const isConsumer = userType === 'consumer';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur Cuizly !</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f4ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', Ubuntu, Cantarell, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Logo -->
                <tr>
                  <td align="center" style="padding: 40px 20px 30px 20px;">
                    <a href="https://www.cuizly.ca" style="text-decoration: none;">
                      <img src="https://www.cuizly.ca/lovable-uploads/db9c9936-605a-4c88-aa46-6154a944bb5c.png" alt="Cuizly" width="120" height="40" style="display: block;">
                    </a>
                  </td>
                </tr>
                
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 0 20px 30px 20px;">
                    <h1 style="margin: 0; color: #171717; font-size: 28px; font-weight: 700; text-align: center; line-height: 1.3;">
                      🎉 Bienvenue sur Cuizly !
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px;">
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      Bonjour ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      ${isConsumer ? 
                        'Félicitations ! Vous êtes maintenant membre de la communauté Cuizly. Découvrez les meilleurs restaurants de Montréal et laissez-vous guider par nos recommandations personnalisées.' :
                        'Félicitations ! Votre restaurant est maintenant présent sur Cuizly. Connectez avec de nouveaux clients et développez votre visibilité grâce à notre plateforme.'
                      }
                    </p>
                    
                    <p style="margin: 0 0 40px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      ${isConsumer ? 
                        'Votre prochain coup de cœur culinaire vous attend !' :
                        'Gérez vos offres, analysez vos performances et attirez plus de clients.'
                      }
                    </p>
                  </td>
                </tr>
                
                <!-- Features -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <div style="background-color: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; font-weight: 600;">
                        ${isConsumer ? 'Ce que vous pouvez faire maintenant :' : 'Commencez dès maintenant :'}
                      </p>
                      ${isConsumer ? `
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Découvrez les restaurants près de chez vous</p>
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Recevez des recommandations personnalisées</p>
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Accédez aux offres exclusives</p>
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Sauvegardez vos restaurants favoris</p>
                      <p style="margin: 0; color: #737373; font-size: 14px; line-height: 1.6;">• Laissez des avis et notez vos expériences</p>
                      ` : `
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Créez et gérez vos offres promotionnelles</p>
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Accédez à votre tableau de bord analytique</p>
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Analysez vos performances et statistiques</p>
                      <p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">• Connectez avec de nouveaux clients</p>
                      <p style="margin: 0; color: #737373; font-size: 14px; line-height: 1.6;">• Optimisez votre visibilité sur la plateforme</p>
                      `}
                    </div>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                ${dashboardUrl ? `
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <a href="${dashboardUrl}" style="background-color: #171717; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px; border-radius: 50px; border: none;">
                      ${isConsumer ? 'Commencer à explorer' : 'Accéder au tableau de bord'}
                    </a>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 40px 20px 20px 20px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
                      L'équipe Cuizly<br>
                      <em>Ton prochain coup de cœur culinaire en un swipe.</em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

serve(handler);