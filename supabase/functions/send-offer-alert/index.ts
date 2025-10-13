import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Simple HTML template function
function createOfferAlertEmailHTML(props: {
  userName: string
  restaurantName: string
  offerTitle: string
  offerDescription: string
  discountType: 'percentage' | 'amount'
  discountValue: number
  validUntil?: string
  restaurantCuisine: string[]
  viewOfferUrl: string
}) {
  const { userName, restaurantName, offerTitle, offerDescription, discountType, discountValue, validUntil, restaurantCuisine, viewOfferUrl } = props;
  const discountText = discountType === 'percentage' ? `${discountValue}% de réduction` : `${discountValue}$ de réduction`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔥 ${restaurantName} : ${offerTitle}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF6B35; margin-bottom: 10px;">🔥 Offre spéciale !</h1>
          <p style="font-size: 18px; color: #666;">Une offre qui pourrait vous intéresser</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p><strong>${restaurantName}</strong> a une offre spéciale pour vous :</p>
          
          <div style="background-color: #FF6B35; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0 0 10px 0;">${offerTitle}</h2>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${discountText}</p>
          </div>
          
          <p><strong>Description :</strong> ${offerDescription}</p>
          <p><strong>Cuisine :</strong> ${restaurantCuisine.join(', ')}</p>
          ${validUntil ? `<p><strong>Valide jusqu'au :</strong> ${validUntil}</p>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewOfferUrl}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Voir l'offre
            </a>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #999;">
          <p>© 2024 Cuizly - Découvrez Montréal autrement</p>
        </div>
      </body>
    </html>
  `;
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
    const html = createOfferAlertEmailHTML({
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

    const emailResponse = await resend.emails.send({
      from: "Cuizly <Iker-ceo@cuizly.ca>",
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