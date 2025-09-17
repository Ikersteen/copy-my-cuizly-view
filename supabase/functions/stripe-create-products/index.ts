import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Create Cuizly Basique Product
    const basicProduct = await stripe.products.create({
      name: "Cuizly Basique",
      description: "Accès à l'assistant culinaire intelligent de Montréal avec recommandations personnalisées, recherche de restaurants, et fonctionnalités de base.",
      unit_label: "mois",
      marketing_features: [
        { name: "Assistant culinaire intelligent" },
        { name: "Recommandations personnalisées" },
        { name: "Recherche de restaurants" },
        { name: "Interface vocale" },
        { name: "Support client standard" }
      ]
    });

    // Create Cuizly Pro Product
    const proProduct = await stripe.products.create({
      name: "Cuizly Pro",
      description: "Plateforme complète pour restaurateurs avec tableau de bord analytics, gestion d'offres, notifications client, et outils marketing avancés.",
      unit_label: "mois",
      marketing_features: [
        { name: "Tableau de bord analytics complet" },
        { name: "Gestion d'offres et promotions" },
        { name: "Notifications client automatisées" },
        { name: "Outils marketing avancés" },
        { name: "Support prioritaire 24/7" },
        { name: "Intégrations avancées" }
      ]
    });

    // Create prices for Cuizly Basique
    const basicMonthlyPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 1999, // $19.99 CAD
      currency: 'cad',
      recurring: {
        interval: 'month'
      },
      nickname: 'Cuizly Basique - Mensuel'
    });

    const basicYearlyPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 19990, // $199.90 CAD (save $39.98)
      currency: 'cad',
      recurring: {
        interval: 'year'
      },
      nickname: 'Cuizly Basique - Annuel'
    });

    // Create prices for Cuizly Pro
    const proMonthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4999, // $49.99 CAD
      currency: 'cad',
      recurring: {
        interval: 'month'
      },
      nickname: 'Cuizly Pro - Mensuel'
    });

    const proYearlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 49990, // $499.90 CAD (save $99.98)
      currency: 'cad',
      recurring: {
        interval: 'year'
      },
      nickname: 'Cuizly Pro - Annuel'
    });

    return new Response(
      JSON.stringify({
        success: true,
        products: {
          basic: {
            product: basicProduct,
            prices: {
              monthly: basicMonthlyPrice,
              yearly: basicYearlyPrice
            }
          },
          pro: {
            product: proProduct,
            prices: {
              monthly: proMonthlyPrice,
              yearly: proYearlyPrice
            }
          }
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Stripe products creation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create Stripe products", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});