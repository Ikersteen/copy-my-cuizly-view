import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

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

    // Generate HTML email
    const html = createOfferAlertHTML(
      userName,
      restaurantName,
      offerTitle,
      offerDescription,
      discountType,
      discountValue,
      validUntil,
      restaurantCuisine,
      viewOfferUrl
    );

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

function createOfferAlertHTML(
  userName: string,
  restaurantName: string,
  offerTitle: string,
  offerDescription: string,
  discountType: 'percentage' | 'amount',
  discountValue: number,
  validUntil?: string,
  restaurantCuisine?: string[],
  viewOfferUrl?: string
) {
  const discountText = discountType === 'percentage' ? `${discountValue}%` : `${discountValue}$`;
  const validText = validUntil ? `Valide jusqu'au ${new Date(validUntil).toLocaleDateString('fr-CA')}` : '';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle offre - ${restaurantName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f4ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', Ubuntu, Cantarell, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 20px 30px 20px; background: linear-gradient(135deg, #171717 0%, #404040 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                      🔥 ${offerTitle}
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #e5e5e5; font-size: 18px;">
                      ${restaurantName}
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      Bonjour ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      ${restaurantName} vous propose une offre spéciale !
                    </p>
                    
                    <!-- Offer Details -->
                    <div style="background-color: #fff5f5; border-left: 4px solid #ff4444; padding: 20px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 10px 0; color: #171717; font-size: 20px; font-weight: 600;">
                        ${discountText} de réduction
                      </h3>
                      <p style="margin: 0 0 15px 0; color: #737373; font-size: 14px; line-height: 1.6;">
                        ${offerDescription}
                      </p>
                      ${validText ? `<p style="margin: 0; color: #ff4444; font-size: 14px; font-weight: 500;">${validText}</p>` : ''}
                    </div>
                    
                    ${restaurantCuisine && restaurantCuisine.length > 0 ? `
                    <p style="margin: 0 0 30px 0; color: #737373; font-size: 14px;">
                      <strong>Type de cuisine :</strong> ${restaurantCuisine.join(', ')}
                    </p>
                    ` : ''}
                  </td>
                </tr>
                
                <!-- CTA Button -->
                ${viewOfferUrl ? `
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <a href="${viewOfferUrl}" style="background-color: #171717; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px; border-radius: 50px; border: none;">
                      Voir l'offre
                    </a>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 40px 20px 20px 20px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
                      L'équipe Cuizly<br>
                      <em>Ton prochain coup de cœur culinaire en un swipe.</em>
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

serve(handler)