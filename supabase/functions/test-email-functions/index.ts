import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("🧪 Testing email functions...")
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Test data
    const testData = {
      email: "test@cuizly.ca",
      userName: "Test User",
      userType: "consumer" as const
    }

    console.log("📧 Testing send-welcome-email function...")
    
    // Test welcome email function
    const { data: welcomeResult, error: welcomeError } = await supabase.functions.invoke('send-welcome-email', {
      body: testData
    })

    if (welcomeError) {
      console.error("❌ Welcome email test failed:", welcomeError)
      throw welcomeError
    }

    console.log("✅ Welcome email test successful:", welcomeResult)

    // Test restaurant notification function
    console.log("📧 Testing send-restaurant-notification function...")
    
    const notificationData = {
      restaurantEmail: "restaurant@cuizly.ca",
      restaurantName: "Test Restaurant",
      customerName: "John Doe",
      notificationType: "new_review" as const,
      details: {
        rating: 5,
        comment: "Excellent restaurant!"
      },
      dashboardUrl: "https://cuizly.ca/dashboard"
    }

    const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-restaurant-notification', {
      body: notificationData
    })

    if (notificationError) {
      console.error("❌ Restaurant notification test failed:", notificationError)
    } else {
      console.log("✅ Restaurant notification test successful:", notificationResult)
    }

    // Test offer alert function
    console.log("📧 Testing send-offer-alert function...")
    
    const offerData = {
      userEmail: "user@cuizly.ca",
      userName: "Test User",
      restaurantName: "Pizza Palace",
      offerTitle: "Pizza 2 pour 1",
      offerDescription: "Obtenez une pizza gratuite pour l'achat d'une pizza",
      discountType: "percentage" as const,
      discountValue: 50,
      restaurantCuisine: ["Italien", "Pizza"],
      viewOfferUrl: "https://cuizly.ca/offers/123"
    }

    const { data: offerResult, error: offerError } = await supabase.functions.invoke('send-offer-alert', {
      body: offerData
    })

    if (offerError) {
      console.error("❌ Offer alert test failed:", offerError)
    } else {
      console.log("✅ Offer alert test successful:", offerResult)
    }

    // Summary
    const results = {
      welcome_email: welcomeError ? "❌ Failed" : "✅ Success",
      restaurant_notification: notificationError ? "❌ Failed" : "✅ Success", 
      offer_alert: offerError ? "❌ Failed" : "✅ Success",
      overall: (!welcomeError && !notificationError && !offerError) ? "✅ All tests passed" : "⚠️ Some tests failed"
    }

    console.log("📊 Test Results:", results)

    return new Response(JSON.stringify({
      message: "Email functions test completed",
      results,
      details: {
        welcome_email: { data: welcomeResult, error: welcomeError },
        restaurant_notification: { data: notificationResult, error: notificationError },
        offer_alert: { data: offerResult, error: offerError }
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error("🚫 Test function error:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "Email functions test failed"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
}

serve(handler)