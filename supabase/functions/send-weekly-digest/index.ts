import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Simple HTML template function
function createWeeklyDigestEmailHTML(props: {
  userName: string
  userType: 'consumer' | 'restaurant_owner'
  stats: {
    newRestaurants?: number
    newOffers?: number
    favoriteRestaurants?: number
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
}) {
  const { userName, userType, stats, recommendations, dashboardUrl } = props;
  const isConsumer = userType === 'consumer';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isConsumer ? '🍽️ Votre digest gourmand hebdomadaire' : '📊 Votre rapport restaurant hebdomadaire'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF6B35; margin-bottom: 10px;">
            ${isConsumer ? '🍽️ Votre digest gourmand' : '📊 Votre rapport restaurant'}
          </h1>
          <p style="font-size: 18px; color: #666;">Résumé de la semaine</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Voici votre résumé de la semaine sur Cuizly :</p>
          
          <div style="margin: 20px 0;">
            ${isConsumer ? `
              ${stats.newRestaurants ? `<p>🏪 <strong>${stats.newRestaurants}</strong> nouveaux restaurants découverts</p>` : ''}
              ${stats.newOffers ? `<p>💰 <strong>${stats.newOffers}</strong> nouvelles offres disponibles</p>` : ''}
              ${stats.favoriteRestaurants ? `<p>⭐ <strong>${stats.favoriteRestaurants}</strong> restaurants dans vos favoris</p>` : ''}
            ` : `
              ${stats.profileViews ? `<p>👀 <strong>${stats.profileViews}</strong> vues sur votre profil</p>` : ''}
              ${stats.newFavorites ? `<p>⭐ <strong>${stats.newFavorites}</strong> nouveaux favoris</p>` : ''}
              ${stats.offerClicks ? `<p>🔥 <strong>${stats.offerClicks}</strong> clics sur vos offres</p>` : ''}
            `}
          </div>
          
          ${recommendations && recommendations.length > 0 ? `
            <div style="margin-top: 30px;">
              <h3 style="color: #FF6B35; margin-bottom: 15px;">
                ${isConsumer ? '🍽️ Recommandations pour vous' : '💡 Suggestions d\'amélioration'}
              </h3>
              ${recommendations.map(rec => `
                <div style="background-color: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #FF6B35;">
                  <strong>${rec.name}</strong><br>
                  <span style="color: #666;">${rec.cuisine}</span>
                  ${rec.offer ? `<br><span style="color: #FF6B35; font-weight: bold;">${rec.offer}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              ${isConsumer ? 'Découvrir plus de restaurants' : 'Voir mon tableau de bord'}
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
    const html = createWeeklyDigestEmailHTML({
      userName,
      userType,
      stats,
      recommendations,
      dashboardUrl,
    })

    const emailResponse = await resend.emails.send({
      from: "Cuizly <Iker-ceo@cuizly.ca>",
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