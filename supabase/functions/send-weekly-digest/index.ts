import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { WeeklyDigestEmail } from './_templates/weekly-digest-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface WeeklyDigestRequest {
  email: string
  userName: string
  userType: 'consumer' | 'restaurant_owner'
  stats: {
    newRestaurants?: number
    newOffers?: number
    favoriteRestaurants?: number
    // For restaurant owners
    profileViews?: number
    newFavorites?: number
    offerClicks?: number
  }
  recommendations?: Array<{
    name: string
    cuisine: string
    offer?: string
  }>
  dashboardUrl: string
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      email,
      userName,
      userType,
      stats,
      recommendations,
      dashboardUrl,
    }: WeeklyDigestRequest = await req.json()

    // Render the email template
    const html = await renderAsync(
      React.createElement(WeeklyDigestEmail, {
        userName,
        userType,
        stats,
        recommendations,
        dashboardUrl,
      })
    )

    const emailResponse = await resend.emails.send({
      from: "Cuizly <digest@cuizly.ca>",
      to: [email],
      subject: userType === 'consumer' 
        ? "🍽️ Votre digest gourmand hebdomadaire"
        : "📊 Votre rapport restaurant hebdomadaire",
      html,
    })

    console.log("Weekly digest sent successfully:", emailResponse)

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error("Error in send-weekly-digest function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
}

serve(handler)