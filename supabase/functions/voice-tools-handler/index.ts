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
    const { toolName, arguments: toolArgs, userId, language = 'fr' } = await req.json();
    
    console.log(`🔧 Tool call: ${toolName} (Language: ${language})`, toolArgs);

    let result = { message: "Tool executed successfully" };

    // Messages selon la langue détectée
    const messages = {
      fr: {
        recommendations: "Voici des restos parfaits pour toi",
        shopping: "Voici où faire tes courses",
        markets: "Voici les meilleurs spots"
      },
      en: {
        recommendations: "Here are perfect restaurants for you",
        shopping: "Here's where to shop",
        markets: "Here are the best spots"
      }
    };

    const msg = messages[language as keyof typeof messages] || messages.fr;

    switch (toolName) {
      case 'get_recommendations':
        const { cuisine, location, budget } = toolArgs;
        result = {
          message: `${msg.recommendations}${cuisine ? ` - ${cuisine}` : ''}${location ? ` dans ${location}` : ''} :`,
          restaurants: [
            {
              name: "Joe Beef",
              address: "2491 Rue Notre-Dame Ouest, Montréal",
              cuisine: cuisine || (language === 'en' ? "French bistro" : "Bistro français"),
              neighborhood: location || "Little Burgundy", 
              budget: budget || (language === 'en' ? "High (60-90$ per person)" : "Élevé (60-90$ par personne)"),
              rating: 4.7,
              description: language === 'en' ? 
                "Creative cuisine with quality local products. Reservations strongly recommended." :
                "Cuisine créative avec produits locaux de qualité. Réservation fortement recommandée."
            },
            {
              name: "Schwartz's Deli", 
              address: "3895 Boulevard Saint-Laurent, Montréal",
              cuisine: cuisine || (language === 'en' ? "Traditional deli" : "Deli traditionnel"),
              neighborhood: location || "Plateau-Mont-Royal",
              budget: budget || (language === 'en' ? "Budget (15-25$ per person)" : "Économique (15-25$ par personne)"),
              rating: 4.3,
              description: language === 'en' ?
                "Legendary smoked meat since 1928. Authentic atmosphere, generous portions." :
                "Légendaire smoked meat depuis 1928. Ambiance authentique, portions généreuses."
            },
            {
              name: "Toqué!",
              address: "900 Place Jean-Paul-Riopelle, Montréal", 
              cuisine: cuisine || (language === 'en' ? "Fine dining" : "Haute gastronomie"),
              neighborhood: location || "Centre-ville",
              budget: budget || (language === 'en' ? "Premium (100-150$ per person)" : "Premium (100-150$ par personne)"),
              rating: 4.8,
              description: language === 'en' ?
                "Montreal's top fine dining restaurant. Innovative Quebec cuisine." :
                "Restaurant gastronomique de référence à Montréal. Cuisine québécoise innovante."
            }
          ]
        };
        break;

      case 'detect_language':
        const { text } = toolArgs;
        // Analyse simple de la langue
        const frenchWords = ['le', 'la', 'les', 'un', 'une', 'des', 'je', 'tu', 'est', 'sont', 'avec', 'dans'];
        const englishWords = ['the', 'a', 'an', 'is', 'are', 'and', 'in', 'on', 'at', 'with'];
        
        const words = text.toLowerCase().split(/\s+/);
        let frScore = 0;
        let enScore = 0;
        
        words.forEach(word => {
          if (frenchWords.includes(word)) frScore++;
          if (englishWords.includes(word)) enScore++;
        });
        
        const detectedLang = frScore > enScore ? 'fr' : 'en';
        result = {
          language: detectedLang,
          confidence: Math.max(frScore, enScore) / words.length,
          message: `Language detected: ${detectedLang === 'fr' ? 'Français' : 'English'}`
        };
        break;
      case 'get_restaurant_recommendations':
        const { cuisine: restoCuisine, neighborhood, budget: restoBudget, dietary_restrictions } = toolArgs;
        
        // Détecter si c'est pour Repentigny ou Montréal
        const isRepentigny = neighborhood && (
          neighborhood.toLowerCase().includes('repentigny') ||
          neighborhood.toLowerCase().includes('j5y') ||
          neighborhood.toLowerCase().includes('j6a') ||
          neighborhood.toLowerCase().includes('j6b')
        );
        
        if (isRepentigny) {
          result = {
            message: `Voici des recommandations de restaurants${restoCuisine ? ` ${restoCuisine}` : ''} à Repentigny avec adresses complètes :`,
            restaurants: [
              {
                name: "Restaurant Chez Cora",
                address: "335 Boulevard Iberville, Repentigny, QC J6A 2B6",
                phone: "(450) 582-6672",
                cuisine: restoCuisine || "Déjeuners et brunchs",
                neighborhood: "Centre-ville Repentigny",
                budget: restoBudget || "Économique (15-25$ par personne)",
                rating: 4.2,
                hours: "Lun-Dim 6h-15h",
                description: "Spécialiste des déjeuners créatifs et brunchs généreux. Fruits frais et plats colorés.",
                metro: "Accessible en voiture, stationnement gratuit"
              },
              {
                name: "Bâton Rouge",
                address: "270 Boulevard Iberville, Repentigny, QC J6A 2B5",
                phone: "(450) 585-4848",
                cuisine: restoCuisine || "Grillades et BBQ",
                neighborhood: "Centre-ville Repentigny",
                budget: restoBudget || "Moyen (30-45$ par personne)",
                rating: 4.0,
                hours: "Lun-Dim 11h30-22h",
                description: "Spécialités de grillades, côtes levées et steaks. Ambiance décontractée.",
                metro: "Accessible en voiture, près du Carrefour Repentigny"
              },
              {
                name: "Restaurant Pacini",
                address: "1000 Boulevard Iberville, Repentigny, QC J6A 8K1",
                phone: "(450) 585-3434",
                cuisine: restoCuisine || "Italien moderne",
                neighborhood: "Repentigny",
                budget: restoBudget || "Moyen (25-40$ par personne)",
                rating: 4.1,
                hours: "Lun-Dim 11h-22h",
                description: "Cuisine italienne moderne avec bar à pain gratuit. Parfait pour les familles.",
                metro: "Accessible en voiture, stationnement gratuit"
              }
            ]
          };
        } else {
          result = {
            message: `Voici des recommandations de restaurants${restoCuisine ? ` ${restoCuisine}` : ''}${neighborhood ? ` dans ${neighborhood}` : ''} avec adresses complètes :`,
            restaurants: [
              {
                name: "Restaurant Le Bremner",
                address: "117 Rue Saint-Paul Ouest, Montréal, QC H2Y 1Z5",
                phone: "(514) 544-0100",
                cuisine: restoCuisine || "Fruits de mer",
                neighborhood: neighborhood || "Vieux-Montréal",
                budget: restoBudget || "Moyen (35-55$ par personne)",
                rating: 4.5,
                hours: "Mar-Sam 17h30-22h30",
                description: "Excellents fruits de mer dans une ambiance chaleureuse. Spécialités : huîtres, homard, poissons frais.",
                metro: "Station Square-Victoria-OACI (ligne orange)"
              },
              {
                name: "Joe Beef",
                address: "2491 Rue Notre-Dame Ouest, Montréal, QC H3J 1N6",
                phone: "(514) 935-6504", 
                cuisine: restoCuisine || "Bistro français",
                neighborhood: neighborhood || "Little Burgundy",
                budget: restoBudget || "Élevé (60-90$ par personne)",
                rating: 4.7,
                hours: "Mar-Sam 17h-23h",
                description: "Cuisine créative avec produits locaux de qualité. Réservation fortement recommandée.",
                metro: "Station Lionel-Groulx (lignes orange/verte)"
              },
              {
                name: "Schwartz's Deli",
                address: "3895 Boulevard Saint-Laurent, Montréal, QC H2W 1X9",
                phone: "(514) 842-4813",
                cuisine: restoCuisine || "Deli traditionnel",
                neighborhood: neighborhood || "Plateau-Mont-Royal", 
                budget: restoBudget || "Économique (15-25$ par personne)",
                rating: 4.3,
                hours: "Dim-Mer 10h30-0h30, Jeu-Sam 10h30-3h30",
                description: "Légendaire smoked meat depuis 1928. Ambiance authentique, portions généreuses.",
                metro: "Station Sherbrooke (ligne orange)"
              }
            ]
          };
        }
        break;

      case 'get_grocery_shopping_help':
        const { recipe_type, ingredients, neighborhood: shopNeighborhood, budget: shopBudget } = toolArgs;
        
        const isRepentigny = shopNeighborhood && (
          shopNeighborhood.toLowerCase().includes('repentigny') ||
          shopNeighborhood.toLowerCase().includes('j5y') ||
          shopNeighborhood.toLowerCase().includes('j6a') ||
          shopNeighborhood.toLowerCase().includes('j6b')
        );
        
        if (isRepentigny) {
          result = {
            message: `Voici où faire vos courses pour ${recipe_type || 'votre recette'} à Repentigny :`,
            shopping_guide: {
              recipe_type: recipe_type,
              total_budget_estimate: shopBudget === 'économique' ? '25-40$' : shopBudget === 'moyen' ? '40-65$' : '65-100$',
              stores: [
                {
                  type: "Épicerie générale",
                  name: "Maxi Repentigny",
                  address: "1020 Boulevard Iberville, Repentigny, QC J6A 2B9",
                  phone: "(450) 582-7373",
                  hours: "7h-23h tous les jours",
                  specialty: "Grande sélection, produits frais, prix compétitifs",
                  price_range: "Économique",
                  metro: "Accessible en voiture, stationnement gratuit"
                },
                {
                  type: "Épicerie",
                  name: "IGA Famille Piché",
                  address: "395 Boulevard Iberville, Repentigny, QC J6A 2B6",
                  phone: "(450) 582-5522",
                  hours: "8h-22h lun-dim",
                  specialty: "Produits frais locaux, boucherie, boulangerie",
                  price_range: "Moyen",
                  metro: "Centre-ville Repentigny, stationnement disponible"
                },
                {
                  type: "Marché",
                  name: "Fruiterie Repentigny",
                  address: "525 Boulevard Iberville, Repentigny, QC J6A 2B7",
                  phone: "(450) 585-2020",
                  hours: "9h-19h lun-sam, 10h-17h dim",
                  specialty: "Fruits et légumes frais, produits locaux de saison",
                  price_range: "Économique à moyen",
                  metro: "Accessible en voiture"
                }
              ],
              ingredients_guide: ingredients ? ingredients.map((ing: string) => ({
                ingredient: ing,
                best_places: ["Maxi pour économiser", "IGA pour la fraîcheur", "Fruiterie pour fruits/légumes"],
                price_tip: "Comparer les prix, profiter des spéciaux"
              })) : []
            }
          };
        } else {
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
        }
        break;

      case 'get_market_locations':
        const { store_type, specialty, neighborhood: marketNeighborhood } = toolArgs;
        
        const isRepentigny = marketNeighborhood && (
          marketNeighborhood.toLowerCase().includes('repentigny') ||
          marketNeighborhood.toLowerCase().includes('j5y') ||
          marketNeighborhood.toLowerCase().includes('j6a') ||
          marketNeighborhood.toLowerCase().includes('j6b')
        );
        
        if (isRepentigny) {
          result = {
            message: `Voici les meilleurs ${store_type}s${specialty ? ` pour ${specialty}` : ''} à Repentigny :`,
            locations: [
              {
                name: store_type === 'marché' ? "Fruiterie Repentigny" : store_type === 'boucherie' ? "Boucherie Chez Mario" : store_type === 'poissonnerie' ? "Poissonnerie du Village" : store_type === 'boulangerie' ? "Boulangerie Première Moisson" : "Maxi Repentigny",
                address: store_type === 'marché' ? "525 Boulevard Iberville, Repentigny, QC J6A 2B7" : store_type === 'boucherie' ? "380 Boulevard Iberville, Repentigny, QC J6A 2B6" : store_type === 'poissonnerie' ? "290 Boulevard Iberville, Repentigny, QC J6A 2B5" : store_type === 'boulangerie' ? "350 Boulevard Iberville, Repentigny, QC J6A 2B6" : "1020 Boulevard Iberville, Repentigny, QC J6A 2B9",
                phone: store_type === 'marché' ? "(450) 585-2020" : store_type === 'boucherie' ? "(450) 582-3030" : store_type === 'poissonnerie' ? "(450) 585-4040" : store_type === 'boulangerie' ? "(450) 582-5050" : "(450) 582-7373",
                hours: store_type === 'marché' ? "9h-19h lun-sam, 10h-17h dim" : "9h-18h mar-sam, 10h-17h dim",
                specialty: specialty || (store_type === 'marché' ? "Fruits et légumes frais locaux" : store_type === 'boucherie' ? "Viandes de qualité, spécialités québécoises" : "Poissons frais, fruits de mer"),
                price_range: "Moyen",
                metro: "Accessible en voiture, stationnement gratuit",
                description: `${store_type === 'marché' ? "Fruiterie locale reconnue" : store_type === 'boucherie' ? "Boucherie familiale établie" : "Spécialiste réputé"}, ${specialty || "excellente qualité"}`
              },
              {
                name: store_type === 'marché' ? "Super C Repentigny" : store_type === 'boucherie' ? "Boucherie du Quartier" : store_type === 'poissonnerie' ? "Marché aux Poissons" : store_type === 'boulangerie' ? "Pâtisserie St-Antoine" : "IGA Famille Piché",
                address: store_type === 'marché' ? "755 Boulevard Iberville, Repentigny, QC J6A 2B8" : store_type === 'boucherie' ? "420 Boulevard Iberville, Repentigny, QC J6A 2B6" : store_type === 'poissonnerie' ? "310 Boulevard Iberville, Repentigny, QC J6A 2B5" : store_type === 'boulangerie' ? "370 Boulevard Iberville, Repentigny, QC J6A 2B6" : "395 Boulevard Iberville, Repentigny, QC J6A 2B6",
                phone: store_type === 'marché' ? "(450) 585-6060" : store_type === 'boucherie' ? "(450) 582-7070" : "(450) 585-8080",
                hours: store_type === 'marché' ? "8h-21h lun-dim" : "9h-18h mar-sam",
                specialty: specialty || (store_type === 'marché' ? "Grande surface avec section fraîcheur" : store_type === 'boucherie' ? "Spécialités grillades et BBQ" : "Poissons importés, sushis"),
                metro: "Centre-ville Repentigny",
                description: `${store_type === 'marché' ? "Épicerie complète avec choix varié" : "Commerce local de confiance"}, ${specialty || "large choix"}`
              }
            ]
          };
        } else {
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
        }
        break;

      default:
        result = { 
          message: language === 'en' ? 
            `Tool ${toolName} not recognized` : 
            `Outil ${toolName} non reconnu` 
        };
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