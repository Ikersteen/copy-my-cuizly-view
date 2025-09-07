import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toolName, arguments: toolArgs, userId } = await req.json();
    
    console.log(`🔧 Tool call: ${toolName}`, toolArgs);

    let result = { message: "Tool executed successfully" };

    switch (toolName) {
      case 'get_restaurant_recommendations':
        const { cuisine, neighborhood, budget, dietary_restrictions } = toolArgs;
        result = {
          message: `Voici des recommandations de restaurants${cuisine ? ` ${cuisine}` : ''}${neighborhood ? ` dans ${neighborhood}` : ''} avec adresses complètes :`,
          restaurants: [
            {
              name: "Restaurant Le Bremner",
              address: "117 Rue Saint-Paul Ouest, Montréal, QC H2Y 1Z5",
              phone: "(514) 544-0100",
              cuisine: cuisine || "Fruits de mer",
              neighborhood: neighborhood || "Vieux-Montréal",
              budget: budget || "Moyen (35-55$ par personne)",
              rating: 4.5,
              hours: "Mar-Sam 17h30-22h30",
              description: "Excellents fruits de mer dans une ambiance chaleureuse. Spécialités : huîtres, homard, poissons frais.",
              metro: "Station Square-Victoria-OACI (ligne orange)"
            },
            {
              name: "Joe Beef",
              address: "2491 Rue Notre-Dame Ouest, Montréal, QC H3J 1N6",
              phone: "(514) 935-6504", 
              cuisine: cuisine || "Bistro français",
              neighborhood: neighborhood || "Little Burgundy",
              budget: budget || "Élevé (60-90$ par personne)",
              rating: 4.7,
              hours: "Mar-Sam 17h-23h",
              description: "Cuisine créative avec produits locaux de qualité. Réservation fortement recommandée.",
              metro: "Station Lionel-Groulx (lignes orange/verte)"
            },
            {
              name: "Schwartz's Deli",
              address: "3895 Boulevard Saint-Laurent, Montréal, QC H2W 1X9",
              phone: "(514) 842-4813",
              cuisine: cuisine || "Deli traditionnel",
              neighborhood: neighborhood || "Plateau-Mont-Royal", 
              budget: budget || "Économique (15-25$ par personne)",
              rating: 4.3,
              hours: "Dim-Mer 10h30-0h30, Jeu-Sam 10h30-3h30",
              description: "Légendaire smoked meat depuis 1928. Ambiance authentique, portions généreuses.",
              metro: "Station Sherbrooke (ligne orange)"
            }
          ]
        };
        break;

      case 'get_grocery_shopping_help':
        const { recipe_type, ingredients, neighborhood: shopNeighborhood, budget: shopBudget } = toolArgs;
        result = {
          message: `Voici où faire vos courses pour ${recipe_type || 'votre recette'}${shopNeighborhood ? ` dans ${shopNeighborhood}` : ''} :`,
          shopping_guide: {
            recipe_type: recipe_type,
            total_budget_estimate: shopBudget === 'économique' ? '25-40$' : shopBudget === 'moyen' ? '40-65$' : '65-100$',
            stores: [
              {
                type: "Épicerie générale",
                name: "IGA Extra",
                address: "1376 Avenue Laurier Est, Montréal, QC H2J 1H8",
                phone: "(514) 524-3334",
                hours: "7h-23h tous les jours",
                specialty: "Large sélection, produits frais, section bio",
                price_range: "Moyen",
                metro: "Station Laurier (ligne orange)"
              },
              {
                type: "Marché",
                name: "Marché Jean-Talon",
                address: "7070 Avenue Henri-Julien, Montréal, QC H2S 3S3",
                phone: "(514) 937-7754",
                hours: "7h-18h (été), 8h-17h (hiver)",
                specialty: "Produits frais locaux, fruits/légumes de saison, prix compétitifs",
                price_range: "Économique à moyen",
                metro: "Station Jean-Talon (ligne orange)"
              },
              {
                type: "Épicerie spécialisée",
                name: "Milano",
                address: "6862 Boulevard Saint-Laurent, Montréal, QC H2S 3C8",
                phone: "(514) 273-8558",
                hours: "8h-20h lun-sam, 8h-19h dim",
                specialty: "Produits italiens, huiles d'olive, fromages, charcuteries",
                price_range: "Moyen à élevé",
                metro: "Station De Castelnau (ligne orange)"
              }
            ],
            ingredients_guide: ingredients ? ingredients.map((ing: string) => ({
              ingredient: ing,
              best_places: ["Marché Jean-Talon pour fraîcheur", "IGA pour commodité", "Milano si spécialisé"],
              price_tip: "Comparer les prix, acheter de saison"
            })) : []
          }
        };
        break;

      case 'get_market_locations':
        const { store_type, specialty, neighborhood: marketNeighborhood } = toolArgs;
        result = {
          message: `Voici les meilleurs ${store_type}s${specialty ? ` pour ${specialty}` : ''}${marketNeighborhood ? ` dans ${marketNeighborhood}` : ''} :`,
          locations: [
            {
              name: store_type === 'marché' ? "Marché Atwater" : store_type === 'boucherie' ? "Boucherie Lawrence" : store_type === 'poissonnerie' ? "Poissonnerie Antoine" : store_type === 'boulangerie' ? "Boulangerie St-Méthode" : "Épicerie Latina",
              address: store_type === 'marché' ? "138 Avenue Atwater, Montréal, QC H4C 2G3" : store_type === 'boucherie' ? "5237 Boulevard Saint-Laurent, Montréal, QC H2T 1S4" : store_type === 'poissonnerie' ? "1840 René-Lévesque Blvd E, Montréal, QC H2K 4M5" : store_type === 'boulangerie' ? "1 Place du Commerce, Montréal, QC H3E 1A2" : "185 Boulevard Saint-Laurent, Montréal, QC H2X 3G7",
              phone: store_type === 'marché' ? "(514) 937-7754" : store_type === 'boucherie' ? "(514) 277-2727" : store_type === 'poissonnerie' ? "(514) 522-2019" : store_type === 'boulangerie' ? "(514) 932-0328" : "(514) 848-1078",
              hours: store_type === 'marché' ? "7h-18h tous les jours" : "9h-18h mar-sam, 10h-17h dim",
              specialty: specialty || (store_type === 'marché' ? "Produits locaux et fermiers" : store_type === 'boucherie' ? "Viandes de qualité, agneau, bœuf vieilli" : "Poissons frais, fruits de mer"),
              price_range: "Moyen",
              metro: store_type === 'marché' ? "Station Lionel-Groulx" : "Station Laurier",
              description: `${store_type === 'marché' ? "Grand marché public avec vendors locaux" : store_type === 'boucherie' ? "Boucherie artisanale reconnue" : "Spécialiste réputé"}, ${specialty || "excellente qualité"}`
            },
            {
              name: store_type === 'marché' ? "Marché Jean-Talon" : store_type === 'boucherie' ? "Boucherie Charcuterie Hongroise" : store_type === 'poissonnerie' ? "La Mer" : store_type === 'boulangerie' ? "Première Moisson" : "Fruiterie 440",
              address: store_type === 'marché' ? "7070 Avenue Henri-Julien, Montréal, QC H2S 3S3" : store_type === 'boucherie' ? "3843 Boulevard Saint-Laurent, Montréal, QC H2W 1Y1" : store_type === 'poissonnerie' ? "1840 René-Lévesque Blvd E, Montréal, QC H2K 4M5" : store_type === 'boulangerie' ? "860 Avenue du Mont-Royal Est, Montréal, QC H2J 1X1" : "3588 Boulevard Saint-Laurent, Montréal, QC H2X 2V1",
              phone: store_type === 'marché' ? "(514) 937-7754" : store_type === 'boucherie' ? "(514) 844-6734" : "(514) 522-3003",
              hours: store_type === 'marché' ? "7h-18h (été), 8h-17h (hiver)" : "9h-18h mar-sam",
              specialty: specialty || (store_type === 'marché' ? "Plus grand marché de Montréal" : store_type === 'boucherie' ? "Spécialités hongroises, saucisses" : "Poissons importés, caviar"),
              metro: store_type === 'marché' ? "Station Jean-Talon" : "Station Sherbrooke",
              description: `${store_type === 'marché' ? "Incontournable pour produits frais" : "Spécialiste reconnu"}, ${specialty || "large choix"}`
            }
          ]
        };
        break;

      default:
        result = { message: `Outil ${toolName} non reconnu` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in voice-tools-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});