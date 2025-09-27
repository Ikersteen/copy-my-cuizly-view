import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      restaurantName,
      customerName,
      customerEmail,
      orderDetails,
      estimatedDeliveryTime,
      dashboardUrl,
    } = await req.json()

    // Generate HTML email
    const html = createRestaurantNotificationHTML(
      restaurantName,
      customerName,
      customerEmail,
      orderDetails,
      estimatedDeliveryTime,
      dashboardUrl
    )

    const { error } = await resend.emails.send({
      from: "Cuizly <notifications@cuizly.ca>",
      to: [customerEmail],
      subject: `Nouvelle commande chez ${restaurantName}`,
      html,
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
}

function createRestaurantNotificationHTML(
  restaurantName: string,
  customerName: string,
  customerEmail: string,
  orderDetails?: any,
  estimatedDeliveryTime?: string,
  dashboardUrl?: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle commande - ${restaurantName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f4ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', Ubuntu, Cantarell, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 20px 30px 20px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                      📋 Nouvelle commande
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
                      Bonjour,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #171717; font-size: 16px; line-height: 1.6;">
                      Vous avez reçu une nouvelle commande de <strong>${customerName}</strong> (${customerEmail}).
                    </p>
                    
                    <!-- Order Details -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 15px 0; color: #171717; font-size: 18px; font-weight: 600;">
                        Détails de la commande
                      </h3>
                      <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">
                        <strong>Client :</strong> ${customerName}
                      </p>
                      <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">
                        <strong>Email :</strong> ${customerEmail}
                      </p>
                      ${estimatedDeliveryTime ? `
                      <p style="margin: 0; color: #475569; font-size: 14px;">
                        <strong>Livraison estimée :</strong> ${estimatedDeliveryTime}
                      </p>
                      ` : ''}
                    </div>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                ${dashboardUrl ? `
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <a href="${dashboardUrl}" style="background-color: #22c55e; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px; border-radius: 50px; border: none;">
                      Gérer la commande
                    </a>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 40px 20px 20px 20px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: #737373; font-size: 14px; text-align: center;">
                      L'équipe Cuizly<br>
                      <em>Votre partenaire culinaire digital.</em>
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