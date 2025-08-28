import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { OfferAlertEmail } from './_templates/offer-alert-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface OfferAlertRequest {
  userEmail: string
  userName: string
  restaurantName: string
  offerTitle: string
  offerDescription: string
  discountType: 'percentage' | 'amount'
  discountValue: number
  validUntil?: string
  restaurantCuisine: string[]
  viewOfferUrl: string
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      userEmail,
      userName,
      restaurantName,
      offerTitle,
      offerDescription,
      discountType,
      discountValue,
      validUntil,
      restaurantCuisine,
      viewOfferUrl,
    }: OfferAlertRequest = await req.json()

    // Render the email template
    const html = await renderAsync(
      React.createElement(OfferAlertEmail, {
        userName,
        restaurantName,
        offerTitle,
        offerDescription,
        discountType,
        discountValue,
        validUntil,
        restaurantCuisine,
        viewOfferUrl,
      })
    )

    const emailResponse = await resend.emails.send({
      from: "Cuizly <Cuizlycanada@gmail.com>",
      to: [userEmail],
      subject: `🔥 ${restaurantName} : ${offerTitle}`,
      html,
    })

    console.log("Offer alert sent successfully:", emailResponse)

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error("Error in send-offer-alert function:", error)
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