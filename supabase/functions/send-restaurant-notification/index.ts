import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Simple HTML template function
function createRestaurantNotificationEmailHTML(props: {
  restaurantName: string
  customerName: string
  notificationType: 'new_review' | 'new_favorite' | 'offer_clicked'
  details?: {
    rating?: number
    comment?: string
    offerTitle?: string
  }
  dashboardUrl: string
}) {
  const { restaurantName, customerName, notificationType, details, dashboardUrl } = props;
  
  let title = '';
  let message = '';
  let icon = '';
  
  switch (notificationType) {
    case 'new_review':
      title = 'Nouveau commentaire';
      message = `${customerName} a laissé un commentaire sur ${restaurantName}`;
      icon = '💬';
      break;
    case 'new_favorite':
      title = 'Nouveau favori';
      message = `${customerName} a ajouté ${restaurantName} à ses favoris !`;
      icon = '⭐';
      break;
    case 'offer_clicked':
      title = 'Offre consultée';
      message = `${customerName} s'intéresse à votre offre !`;
      icon = '👀';
      break;
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${icon} ${title} - ${restaurantName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF6B35; margin-bottom: 10px;">${icon} ${title}</h1>
          <p style="font-size: 18px; color: #666;">Nouvelle activité sur votre restaurant</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <p style="font-size: 16px; margin-bottom: 20px;"><strong>${message}</strong></p>
          
          ${details?.rating ? `<p><strong>Note :</strong> ${details.rating}/5 ⭐</p>` : ''}
          ${details?.comment ? `<p><strong>Commentaire :</strong> "${details.comment}"</p>` : ''}
          ${details?.offerTitle ? `<p><strong>Offre consultée :</strong> ${details.offerTitle}</p>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Voir mon tableau de bord
            </a>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #999;">
          <p>© 2024 Cuizly - Votre partenaire restaurant</p>
        </div>
      </body>
    </html>
  `;
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
    const html = createRestaurantNotificationEmailHTML({
      restaurantName,
      customerName,
      notificationType,
      details,
      dashboardUrl,
    })

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