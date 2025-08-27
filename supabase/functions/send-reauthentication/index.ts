import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { ReauthenticationEmail } from './_templates/reauthentication-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReauthenticationRequest {
  email: string;
  confirmationUrl: string;
  userName: string;
  actionDescription: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, userName, actionDescription }: ReauthenticationRequest = await req.json();

    // Render the React email template
    const html = await renderAsync(
      React.createElement(ReauthenticationEmail, {
        confirmationUrl,
        userName,
        actionDescription,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Cuizly <security@cuizly.com>",
      to: [email],
      subject: "Confirmation de sécurité requise - Cuizly",
      html,
    });

    console.log("Reauthentication email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reauthentication function:", error);
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