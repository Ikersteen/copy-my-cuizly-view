import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { EmailChangeEmail } from './_templates/email-change-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailChangeRequest {
  email: string;
  confirmationUrl: string;
  userName: string;
  newEmail: string;
  oldEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, userName, newEmail, oldEmail }: EmailChangeRequest = await req.json();

    // Render the React email template
    const html = await renderAsync(
      React.createElement(EmailChangeEmail, {
        confirmationUrl,
        userName,
        newEmail,
        oldEmail,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Cuizly <security@cuizly.com>",
      to: [email],
      subject: "Confirmation - Changement d'adresse courriel",
      html,
    });

    console.log("Email change confirmation sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-change function:", error);
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