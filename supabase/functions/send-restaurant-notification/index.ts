import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { RestaurantNotificationEmail } from './_templates/restaurant-notification-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface RestaurantNotificationRequest {
  restaurantEmail: string
  restaurantName: string
  customerName: string
  notificationType: 'new_review' | 'new_favorite' | 'offer_clicked'
  details?: {
    rating?: number
    comment?: string
    offerTitle?: string
  }
  dashboardUrl: string
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      restaurantEmail,
      restaurantName,
      customerName,
      notificationType,
      details,
      dashboardUrl,
    }: RestaurantNotificationRequest = await req.json()

    // Render the email template
    const html = await renderAsync(
      React.createElement(RestaurantNotificationEmail, {
        restaurantName,
        customerName,
        notificationType,
        details,
        dashboardUrl,
      })
    )

    // Get subject based on notification type
    const getSubject = () => {
      switch (notificationType) {
        case 'new_review':
          return `💬 Nouveau commentaire pour ${restaurantName}`
        case 'new_favorite':
          return `⭐ ${restaurantName} ajouté aux favoris !`
        case 'offer_clicked':
          return `👀 Votre offre intéresse un client !`
        default:
          return `📱 Nouvelle activité sur ${restaurantName}`
      }
    }

    const emailResponse = await resend.emails.send({
      from: "Cuizly <Cuizlycanada@gmail.com>",
      to: [restaurantEmail],
      subject: getSubject(),
      html,
    })

    console.log("Restaurant notification sent successfully:", emailResponse)

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error("Error in send-restaurant-notification function:", error)
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