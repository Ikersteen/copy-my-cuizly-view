import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
        user_metadata?: {
          full_name?: string
        }
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    // Only handle signup confirmations
    if (email_action_type !== 'signup') {
      return new Response('Email type not handled', { status: 200 })
    }

    const userName = user.user_metadata?.full_name || 'Utilisateur';
    const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=https://www.cuizly.ca/auth`;
    
    const html = createConfirmationEmailHTML(userName, confirmationUrl, 'consumer');

    const { error } = await resend.emails.send({
      from: 'Cuizly <Cuizlycanada@gmail.com>',
      to: [user.email],
      subject: 'Confirmez votre adresse email - Cuizly',
      html,
    })
    
    if (error) {
      throw error
    }
  } catch (error) {
    console.log(error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
};

function createConfirmationEmailHTML(userName: string, confirmationUrl: string, userType: 'consumer' | 'restaurant_owner') {
  const features = userType === 'consumer' 
    ? ['• Découvrir les meilleurs restaurants de Montréal', '• Recevoir des recommandations personnalisées', '• Accéder aux offres exclusives', '• Sauvegarder vos favoris']
    : ['• Créer et gérer vos offres', '• Accéder à votre tableau de bord', '• Analyser vos performances', '• Connecter avec de nouveaux clients'];
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmez votre email - Cuizly</title>
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
                      Confirmez votre email
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
                      Merci de vous être inscrit sur Cuizly ! Pour finaliser la création de votre compte ${userType === 'consumer' ? 'consommateur' : 'restaurateur'}, veuillez confirmer votre adresse email.
                    </p>
                    
                    <p style="margin: 0 0 40px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      Cliquez sur le bouton ci-dessous pour activer votre compte :
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <a href="${confirmationUrl}" style="background-color: #171717; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px; border-radius: 50px; border: none;">
                      Confirmer mon email
                    </a>
                  </td>
                </tr>
                
                <!-- Alternative link -->
                <tr>
                  <td style="padding: 0 40px;">
                    <p style="margin: 20px 0 10px 0; color: #737373; font-size: 14px; line-height: 1.6;">
                      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                    </p>
                    <p style="margin: 0 0 30px 0; color: #737373; font-size: 12px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 8px; font-family: monospace;">
                      ${confirmationUrl}
                    </p>
                  </td>
                </tr>
                
                <!-- What's next -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <div style="background-color: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6; font-weight: 600;">
                        Après confirmation, vous pourrez :
                      </p>
                      ${features.map(feature => `<p style="margin: 0 0 8px 0; color: #737373; font-size: 14px; line-height: 1.6;">${feature}</p>`).join('')}
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 40px 20px 20px 20px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 20px 0; color: #737373; font-size: 14px; text-align: center;">
                      L'équipe Cuizly<br>
                      <em>Ton prochain coup de cœur culinaire en un swipe.</em>
                    </p>
                    <p style="margin: 0; color: #a3a3a3; font-size: 12px; text-align: center; font-style: italic;">
                      Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email en toute sécurité.
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