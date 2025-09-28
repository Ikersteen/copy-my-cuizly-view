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

// Simple HTML template function
function createConfirmationEmailHTML(confirmationUrl: string, userName: string, userType: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmez votre adresse email - Cuizly</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF6B35; margin-bottom: 10px;">Bienvenue chez Cuizly !</h1>
          <p style="font-size: 18px; color: #666;">Confirmez votre adresse email pour commencer</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Merci de vous être inscrit(e) sur Cuizly ! Pour finaliser votre inscription et commencer à découvrir les meilleurs restaurants de Montréal, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Confirmer mon email
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${confirmationUrl}</p>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #999;">
          <p>Si vous n'avez pas créé de compte Cuizly, vous pouvez ignorer cet email en toute sécurité.</p>
          <p>© 2024 Cuizly - Découvrez Montréal autrement</p>
        </div>
      </body>
    </html>
  `;
}

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
    
    const html = createConfirmationEmailHTML(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=https://www.cuizly.ca/auth`,
      userName,
      'consumer'
    );

    const { error } = await resend.emails.send({
      from: 'Cuizly <Cuizlycanada@gmail.com>',
      to: [user.email],
      subject: 'Confirmez votre adresse email - Cuizly',
      html,
    })
    
    if (error) {
      throw error
    }
  } catch (error: any) {
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

serve(handler);