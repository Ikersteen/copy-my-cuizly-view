import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  resetUrl: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl, userName }: PasswordResetEmailRequest = await req.json();

    // Generate HTML email
    const html = createPasswordResetHTML(resetUrl, userName);

    const emailResponse = await resend.emails.send({
      from: "Cuizly <Cuizlycanada@gmail.com>",
      to: [email],
      subject: "Réinitialisation de votre mot de passe Cuizly",
      html,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function createPasswordResetHTML(resetUrl: string, userName?: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation mot de passe - Cuizly</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f4ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', Ubuntu, Cantarell, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 20px 30px 20px;">
                    <h1 style="margin: 0; color: #171717; font-size: 28px; font-weight: 700; text-align: center;">
                      🔐 Réinitialisation de mot de passe
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px;">
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      Vous avez demandé la réinitialisation de votre mot de passe sur Cuizly.
                    </p>
                    
                    <p style="margin: 0 0 40px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <a href="${resetUrl}" style="background-color: #171717; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px; border-radius: 50px; border: none;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
                
                <!-- Security notice -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9500;">
                      <p style="margin: 0 0 10px 0; color: #171717; font-size: 14px; font-weight: 600;">
                        Important pour votre sécurité :
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #737373; font-size: 14px; line-height: 1.6;">
                        <li>Ce lien expire dans 1 heure</li>
                        <li>Utilisez-le seulement une fois</li>
                        <li>Ne le partagez avec personne</li>
                      </ul>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 40px 20px 20px 20px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 20px 0; color: #737373; font-size: 14px; text-align: center;">
                      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
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