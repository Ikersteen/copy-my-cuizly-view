import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now?: boolean;
  };
}

interface ImportRequest {
  location: string;
  radius: number;
  maxResults: number;
  testMode: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Début de l'importation de restaurants depuis Google Places");

    // Vérification des secrets
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🔑 Vérification des secrets:");
    console.log(`- Google Maps API Key: ${googleMapsApiKey ? 'PRÉSENT ✅' : 'MANQUANT ❌'}`);
    console.log(`- Supabase URL: ${supabaseUrl ? 'PRÉSENT ✅' : 'MANQUANT ❌'}`);
    console.log(`- Supabase Service Key: ${supabaseServiceKey ? 'PRÉSENT ✅' : 'MANQUANT ❌'}`);

    if (!googleMapsApiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY n'est pas configuré");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuration Supabase manquante");
    }

    // Parse de la requête
    const { location, radius, maxResults, testMode }: ImportRequest = await req.json();

    console.log(`📍 Recherche de restaurants près de: ${location}`);
    console.log(`📊 Paramètres: rayon=${radius}m, max=${maxResults}, test=${testMode}`);

    // Initialisation du client Supabase avec les permissions admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // VERSION DE TEST - CONTOURNEMENT TEMPORAIRE
    // Utilisation de coordonnées fixes pour éviter l'API Geocoding
    let lat: number, lng: number;
    
    console.log(`🔧 CONTOURNEMENT TEMPORAIRE: Utilisation de coordonnées fixes pour ${location}`);
    
    if (location.toLowerCase().includes('montreal') || location.toLowerCase().includes('montréal')) {
      lat = 45.5017;  // Montréal centre-ville
      lng = -73.5673;
      console.log(`📍 Coordonnées fixes Montréal: ${lat}, ${lng}`);
    } else if (location.toLowerCase().includes('repentigny')) {
      lat = 45.7420;  // Repentigny  
      lng = -73.4500;
      console.log(`📍 Coordonnées fixes Repentigny: ${lat}, ${lng}`);
    } else {
      // Fallback vers Montréal pour autres locations
      lat = 45.5017;
      lng = -73.5673;
      console.log(`📍 Fallback vers Montréal pour: ${location}`);
    }
    console.log(`🗺️ Coordonnées trouvées: ${lat}, ${lng}`);

    // Recherche de restaurants via Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${googleMapsApiKey}`;
    
    console.log(`🔍 URL Places API: ${placesUrl.replace(googleMapsApiKey, '***API_KEY***')}`);
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    console.log(`📡 Réponse Places API:`, JSON.stringify(placesData, null, 2));
    console.log(`📊 Status Places API: ${placesData.status}`);

    if (placesData.status !== "OK") {
      if (placesData.status === "REQUEST_DENIED" && placesData.error_message?.includes("referer restrictions")) {
        throw new Error(`PROBLÈME DE CONFIGURATION: Votre clé API Google a des restrictions de référent qui l'empêchent de fonctionner depuis un serveur. Vous devez soit:
1. Créer une nouvelle clé API sans restrictions de référent pour les fonctions serveur
2. Ou modifier les restrictions de votre clé actuelle dans Google Cloud Console`);
      }
      throw new Error(`Erreur Places API: ${placesData.status} - ${placesData.error_message || 'Erreur inconnue'}`);
    }

    const restaurants = placesData.results as GooglePlaceResult[];
    const limitedRestaurants = restaurants.slice(0, maxResults);
    
    console.log(`🏪 ${limitedRestaurants.length} restaurants trouvés`);

    // Obtenir l'utilisateur authentifié pour l'assigner comme propriétaire temporaire
    const authHeader = req.headers.get("Authorization");
    console.log(`🔐 Auth header présent: ${authHeader ? 'OUI' : 'NON'}`);
    
    if (!authHeader) {
      console.error("❌ Pas d'en-tête Authorization");
      throw new Error("Authentification requise - en-tête manquant");
    }

    // Créer un client Supabase avec l'auth header pour cet utilisateur
    const userSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    console.log(`👤 Utilisateur récupéré: ${user ? user.id : 'AUCUN'}`);
    console.log(`❌ Erreur auth: ${authError ? authError.message : 'AUCUNE'}`);

    if (authError || !user) {
      console.error("❌ Authentification échouée:", authError);
      throw new Error(`Utilisateur non authentifié: ${authError?.message || 'utilisateur null'}`);
    }

    console.log(`👤 Import par l'utilisateur: ${user.id}`);

    // Traitement et insertion des restaurants
    let successCount = 0;
    let errorCount = 0;
    const logs: string[] = [];

    for (const place of limitedRestaurants) {
      try {
        // Validation et transformation des données
        const restaurantName = place.name;
        const address = place.vicinity || place.formatted_address || 'Adresse non disponible';
        
        // Déterminer le type de cuisine basé sur les types Google
        const cuisineTypes = extractCuisineTypes(place.types);
        
        // Déterminer la gamme de prix
        const priceRange = getPriceRange(place.price_level);

        // Vérifier si le restaurant existe déjà (par nom et adresse similaire)
        const { data: existingRestaurants } = await supabase
          .from('restaurants')
          .select('id, name, address')
          .ilike('name', `%${restaurantName}%`)
          .limit(5);

        const isDuplicate = existingRestaurants?.some(existing => 
          existing.name.toLowerCase() === restaurantName.toLowerCase() ||
          (existing.address && address && 
           existing.address.toLowerCase().includes(address.toLowerCase().substring(0, 20)))
        );

        if (isDuplicate) {
          logs.push(`⚠️ Restaurant "${restaurantName}" déjà existant, ignoré`);
          continue;
        }

        // Préparer les données pour l'insertion
        const restaurantData = {
          name: restaurantName,
          description: `Restaurant importé depuis Google Places. ${address}`,
          description_fr: `Restaurant importé depuis Google Places situé à ${address}`,
          description_en: `Restaurant imported from Google Places located at ${address}`,
          address: address,
          phone: null, // Nécessiterait Place Details API
          email: null, // Pas disponible via Places API
          cuisine_type: cuisineTypes,
          price_range: priceRange,
          owner_id: user.id, // Assigné à l'administrateur qui fait l'import
          is_active: true,
          dietary_restrictions: [],
          allergens: [],
          restaurant_specialties: [],
          service_types: ['dine_in'], // Par défaut
          delivery_radius: 5 // Par défaut
        };

        if (testMode) {
          logs.push(`🧪 [TEST] Restaurantserait inséré: ${restaurantName}`);
          successCount++;
        } else {
          // Insertion en base de données
          const { data: insertedRestaurant, error: insertError } = await supabase
            .from('restaurants')
            .insert(restaurantData)
            .select('id, name')
            .single();

          if (insertError) {
            console.error(`❌ Erreur insertion ${restaurantName}:`, insertError);
            logs.push(`❌ Erreur: ${restaurantName} - ${insertError.message}`);
            errorCount++;
          } else {
            console.log(`✅ Restaurant inséré: ${restaurantName}`);
            logs.push(`✅ Succès: ${restaurantName} importé avec ID ${insertedRestaurant.id}`);
            successCount++;
          }
        }

      } catch (error) {
        console.error(`❌ Erreur traitement ${place.name}:`, error);
        logs.push(`❌ Erreur traitement "${place.name}": ${error.message}`);
        errorCount++;
      }
    }

    const result = {
      success: successCount,
      errors: errorCount,
      total: limitedRestaurants.length,
      logs: logs,
      testMode: testMode
    };

    console.log("📊 Résultats de l'importation:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("💥 Erreur générale:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: 0,
        errors: 1,
        total: 0,
        logs: [`💥 Erreur générale: ${error.message}`]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Fonction utilitaire pour extraire les types de cuisine
function extractCuisineTypes(types: string[]): string[] {
  const cuisineMapping: Record<string, string> = {
    'bakery': 'Boulangerie',
    'bar': 'Bar',
    'cafe': 'Café',
    'meal_delivery': 'Livraison',
    'meal_takeaway': 'À emporter',
    'pizza': 'Pizza',
    'fast_food': 'Fast Food',
    'food': 'Restaurant'
  };

  const cuisines = types
    .map(type => cuisineMapping[type])
    .filter(Boolean);

  return cuisines.length > 0 ? cuisines : ['Restaurant'];
}

// Fonction utilitaire pour déterminer la gamme de prix
function getPriceRange(priceLevel?: number): string {
  switch (priceLevel) {
    case 0:
    case 1:
      return 'budget';
    case 2:
      return 'moderate';
    case 3:
      return 'expensive';
    case 4:
      return 'very_expensive';
    default:
      return 'moderate'; // Par défaut
  }
}