import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  types: string[];
  photos?: GooglePlacePhoto[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
  };
}

interface UserPreferences {
  cuisine_preferences?: string[];
  price_range?: string;
  dietary_restrictions?: string[];
  allergens?: string[];
  delivery_radius?: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, preferences, radius = 5000 } = await req.json();
    
    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Base Google Places API search
    const placesUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    placesUrl.searchParams.set("location", `${latitude},${longitude}`);
    placesUrl.searchParams.set("radius", radius.toString());
    placesUrl.searchParams.set("type", "restaurant");
    placesUrl.searchParams.set("key", googleApiKey);

    // Add cuisine-based keyword if preferences exist
    if (preferences?.cuisine_preferences?.length > 0) {
      const cuisineKeywords = preferences.cuisine_preferences.join(" OR ");
      placesUrl.searchParams.set("keyword", cuisineKeywords);
    }

    const placesResponse = await fetch(placesUrl.toString());
    const placesData = await placesResponse.json();

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${placesData.status}`);
    }

    // Transform Google Places results to match our restaurant format
    const recommendations = placesData.results
      .filter((place: GooglePlace) => place.rating && place.rating >= 3.5) // Filter by minimum rating
      .slice(0, 20) // Limit results
      .map((place: GooglePlace) => {
        const photoUrl = place.photos?.[0] 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleApiKey}`
          : null;

        // Map price level to our format
        let priceRange = "$$";
        if (place.price_level !== undefined) {
          switch (place.price_level) {
            case 0: priceRange = "$"; break;
            case 1: priceRange = "$"; break;
            case 2: priceRange = "$$"; break;
            case 3: priceRange = "$$$"; break;
            case 4: priceRange = "$$$$"; break;
          }
        }

        // Extract cuisine types from Google Places types
        const cuisineTypes = place.types
          .filter(type => 
            !['establishment', 'food', 'point_of_interest', 'restaurant'].includes(type)
          )
          .map(type => type.replace(/_/g, ' '))
          .slice(0, 3);

        // Generate recommendation reasons based on preferences
        const reasons = generateRecommendationReasons(place, preferences);

        return {
          id: place.place_id,
          name: place.name,
          description: `Restaurant découvert via Google Places - ${place.vicinity}`,
          address: place.vicinity,
          cuisine_type: cuisineTypes.length > 0 ? cuisineTypes : ["restaurant"],
          price_range: priceRange,
          logo_url: photoUrl,
          cover_image_url: photoUrl,
          rating: place.rating || 0,
          is_active: true,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          google_place_id: place.place_id,
          is_open_now: place.opening_hours?.open_now,
          reasons: reasons,
          source: "google_places"
        };
      });

    // Sort by relevance (rating, distance, preferences match)
    const sortedRecommendations = recommendations.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, preferences, latitude, longitude);
      const bScore = calculateRelevanceScore(b, preferences, latitude, longitude);
      return bScore - aScore;
    });

    return new Response(
      JSON.stringify({ 
        recommendations: sortedRecommendations,
        source: "google_places",
        total_found: placesData.results?.length || 0
      }),
      { 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error("Error in google-places-recommendations:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});

function generateRecommendationReasons(place: GooglePlace, preferences?: UserPreferences): string[] {
  const reasons: string[] = [];

  if (place.rating && place.rating >= 4.5) {
    reasons.push("Excellente note Google");
  } else if (place.rating && place.rating >= 4.0) {
    reasons.push("Très bien noté");
  }

  if (place.opening_hours?.open_now) {
    reasons.push("Ouvert maintenant");
  }

  // Check cuisine preferences match
  if (preferences?.cuisine_preferences) {
    const matchingCuisines = place.types.some(type => 
      preferences.cuisine_preferences?.some(pref => 
        type.toLowerCase().includes(pref.toLowerCase()) || 
        pref.toLowerCase().includes(type.toLowerCase())
      )
    );
    if (matchingCuisines) {
      reasons.push("Correspond à vos préférences");
    }
  }

  // Check price range
  if (preferences?.price_range && place.price_level !== undefined) {
    const preferredLevel = preferences.price_range.length; // $ = 1, $$ = 2, etc.
    if (Math.abs(place.price_level - preferredLevel) <= 1) {
      reasons.push("Dans votre gamme de prix");
    }
  }

  if (reasons.length === 0) {
    reasons.push("Restaurant populaire dans la région");
  }

  return reasons.slice(0, 3); // Limit to 3 reasons
}

function calculateRelevanceScore(
  restaurant: any, 
  preferences?: UserPreferences, 
  userLat?: number, 
  userLng?: number
): number {
  let score = 0;

  // Rating weight (40% of score)
  if (restaurant.rating) {
    score += (restaurant.rating / 5) * 40;
  }

  // Distance weight (30% of score) - closer is better
  if (userLat && userLng && restaurant.latitude && restaurant.longitude) {
    const distance = calculateDistance(userLat, userLng, restaurant.latitude, restaurant.longitude);
    const distanceScore = Math.max(0, 30 - (distance / 1000) * 5); // Decrease score for distant places
    score += distanceScore;
  }

  // Preferences match weight (30% of score)
  if (preferences) {
    let preferencesScore = 0;
    
    // Cuisine match
    if (preferences.cuisine_preferences && restaurant.cuisine_type) {
      const matches = preferences.cuisine_preferences.some(pref =>
        restaurant.cuisine_type.some((cuisine: string) =>
          cuisine.toLowerCase().includes(pref.toLowerCase()) ||
          pref.toLowerCase().includes(cuisine.toLowerCase())
        )
      );
      if (matches) preferencesScore += 15;
    }

    // Price range match
    if (preferences.price_range && restaurant.price_range) {
      if (preferences.price_range === restaurant.price_range) {
        preferencesScore += 10;
      }
    }

    // Open now bonus
    if (restaurant.is_open_now) {
      preferencesScore += 5;
    }

    score += preferencesScore;
  }

  return score;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}