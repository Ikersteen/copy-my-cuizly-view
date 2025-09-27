import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { ConfirmationEmail } from './_templates/confirmation-email.tsx';

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
    
    const html = await renderAsync(
      React.createElement(ConfirmationEmail, {
        confirmationUrl: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=https://www.cuizly.ca/auth`,
        userName,
        userType: 'consumer',
      })
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

serve(handler);