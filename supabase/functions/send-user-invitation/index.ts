import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { UserInvitationEmail } from './_templates/user-invitation-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserInvitationRequest {
  email: string;
  invitationUrl: string;
  inviterName: string;
  inviteeName: string;
  userType: 'consumer' | 'restaurant_owner';
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      invitationUrl, 
      inviterName, 
      inviteeName, 
      userType, 
      customMessage 
    }: UserInvitationRequest = await req.json();

    // Render the React email template
    const html = await renderAsync(
      React.createElement(UserInvitationEmail, {
        invitationUrl,
        inviterName,
        inviteeName,
        userType,
        customMessage,
      })
    );

    const emailResponse = await resend.emails.send({
      from: `${inviterName} via Cuizly <invitations@cuizly.com>`,
      to: [email],
      subject: `${inviterName} vous invite à découvrir Cuizly !`,
      html,
    });

    console.log("User invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-invitation function:", error);
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