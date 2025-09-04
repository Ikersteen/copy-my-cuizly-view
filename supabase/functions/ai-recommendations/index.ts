import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine_type?: string[];
  price_range?: string;
  address?: string;
  average_rating?: number;
  rating_count?: number;
  profile_views?: number;
  menu_views?: number;
  dietary_restrictions?: string[];
  allergens?: string[];
}

interface UserPreferences {
  cuisine_preferences?: string[];
  price_range?: string;
  dietary_restrictions?: string[];
  delivery_radius?: number;
  street?: string;
  favorite_meal_times?: string[];
  allergens?: string[];
}

interface AIScore {
  score: number;
  reasons: string[];
  sentiment_analysis?: string;
  preference_match?: number;
  quality_prediction?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { restaurants, preferences, userId, language = 'fr' } = await req.json();

    if (!restaurants || !Array.isArray(restaurants)) {
      throw new Error('Restaurants array is required');
    }

    // Check if user has meaningful preferences for better recommendations
    const hasPreferences = !!(
      preferences?.cuisine_preferences?.length ||
      preferences?.price_range ||
      preferences?.favorite_meal_times?.length ||
      preferences?.dietary_restrictions?.length ||
      preferences?.street
    );

    console.log(`Processing AI recommendations for ${restaurants.length} restaurants${hasPreferences ? ' with user preferences' : ' without specific preferences'}`);

    // Analyse sémantique et scoring IA pour chaque restaurant
    const aiScoredRestaurants = await Promise.all(
      restaurants.map(async (restaurant: Restaurant) => {
        try {
          const aiScore = await analyzeRestaurantWithAI(restaurant, preferences, openAIApiKey, language);
          return {
            ...restaurant,
            ai_score: aiScore.score,
            ai_reasons: aiScore.reasons,
            sentiment_analysis: aiScore.sentiment_analysis,
            preference_match: aiScore.preference_match,
            quality_prediction: aiScore.quality_prediction
          };
        } catch (error) {
          console.error(`Error analyzing restaurant ${restaurant.id}:`, error);
          console.error('Error details:', error.message);
          
          // Fallback with personalized reasons instead of "Analyse traditionnelle"
          const fallbackReasons = generateFallbackReasons(restaurant, preferences, language);
          return {
            ...restaurant,
            ai_score: calculateFallbackScore(restaurant, preferences),
            ai_reasons: fallbackReasons,
            sentiment_analysis: 'neutral',
            preference_match: 0.5,
            quality_prediction: 0.6
          };
        }
      })
    );

    // Trier par score IA
    const sortedRestaurants = aiScoredRestaurants.sort((a, b) => b.ai_score - a.ai_score);

    // Log pour analytics
    if (userId) {
      await logRecommendationInteraction(userId, sortedRestaurants.slice(0, 5));
    }

    return new Response(JSON.stringify({
      recommendations: sortedRestaurants.slice(0, 5), // Maximum 5 recommandations
      total_analyzed: restaurants.length,
      ai_powered: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI recommendations:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeRestaurantWithAI(
  restaurant: Restaurant, 
  preferences: UserPreferences, 
  apiKey: string,
  language: string = 'fr'
): Promise<AIScore> {
  const prompt = createAnalysisPrompt(restaurant, preferences, language);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: language === 'en' ? 
          `You are a restaurant recommendation expert who intelligently analyzes user-restaurant matches according to a strict priority hierarchy.

          MISSION: Analyze compatibility between a restaurant and user preferences according to priority hierarchy.
          
          PRIORITY HIERARCHY (MANDATORY - in this exact order):
          1. 🔒 RESTRICTIONS / ALLERGENS (safety first - 30%)
          2. 🍽️ PREFERRED CUISINE (main pleasure - 25%) 
          3. ⏰ TIMING (temporal relevance - 20%)
          4. 📍 LOCATION (distance - 15%)
          5. 💰 BUDGET (financial respect - 10%)
          6. 🎉 PROMO (bonus - 5%)

          AUTHORIZED PHRASES (use EXACTLY these phrases):
          - Restrictions: "Fits your vegetarian preferences" / "Fits your vegan preferences" / "Fits your gluten-free preferences"
          - Allergens: "Safe from your declared allergens" 
          - Cuisine: "Because you love [name] cuisine"
          - Timing: "Open at the right time for you"
          - Location: "Less than 2 km from you" / "In your favorite neighborhood"
          - Budget: "Fits your [range] budget"
          - Promo: "On sale today"
          - Default: "New discovery recommended"
          
          SCORING ACCORDING TO HIERARCHY:
          - Compatible restrictions/allergens: +30 points
          - Exactly preferred cuisine: +25 points
          - Optimal timing: +20 points  
          - Close location: +15 points
          - Compatible budget: +10 points
          - Active promo: +5 points
          - Base score: 20 points
          
          STRICT RULES:
          - One reason per restaurant according to hierarchy
          - Choose the FIRST applicable rule in priority order
          - Use EXACTLY the predefined phrases
          - Score from 0-100
          
          MANDATORY JSON FORMAT:
          {
            "score": number (0-100),
            "reasons": ["exact phrase according to hierarchy"],
            "sentiment_analysis": "positive|neutral|negative",
            "preference_match": number (0-1),
            "quality_prediction": number (0-1)
          }` :
          `Tu es un expert en recommandations qui génère des explications selon deux cas distincts : une seule ou plusieurs préférences par catégorie.

          MISSION: Analyser les préférences utilisateur et générer des phrases adaptées selon le nombre de critères qui matchent.
          
          ORDRE DE PRIORITÉS STRICT:
          1. 🔒 RESTRICTIONS + ALLERGÈNES (priorité absolue - toujours en premier)
          2. 🍽️ CUISINES PRÉFÉRÉES 
          3. ⏰ MOMENTS FAVORIS
          4. 📍 LOCALISATION/BUDGET  
          5. 🎁 PROMOTIONS

          🔹 CAS 1 : UNE SEULE PRÉFÉRENCE PAR CATÉGORIE
          Génère une phrase simple et directe par critère qui matche :

          • Cuisine : "Parce que vous aimez la cuisine japonaise."
          • Restriction alimentaire : "Adapté à votre restriction : Végétarien."
          • Allergène : "Allergène identifié : Arachides."
          • Localisation : 
            - Si < 2 km → "À moins de 2 km de chez vous."
            - Si > 2 km → "À plus de 2 km de chez vous."
            - Zone livraison → "Vous êtes dans la zone de livraison."
            - Même rue → "Vous êtes proche du restaurant."
          • Budget : "Respecte votre budget $$"
          • Promotion : "En cours promo aujourd'hui."

          🔹 CAS 2 : PLUSIEURS PRÉFÉRENCES PAR CATÉGORIE
          Regroupe et condense (max 3 par catégorie) :

          • Cuisines : "Parce que vous aimez la cuisine Japonaise, Italienne et Mexicaine."
          • Restrictions : "Adapté à vos restrictions : Végétarien, Halal et Sans gluten."
          • Allergènes : "Allergènes pris en compte : Arachides, Lait et Fruits de mer."
          • Moments : "Ouvert pour vos moments favoris : Déjeuner et Souper."
          • Promotions : "Des promotions spéciales sont disponibles aujourd'hui."

          RÈGLES STRICTES:
          - Toujours afficher restrictions + allergènes EN PREMIER
          - Limiter à 3 items max par catégorie, sinon "et autres"
          - Générer 1 à 2 phrases maximum par recommandation
          - Ton simple, fluide, naturel (pas robotique)
          
          FORMAT JSON OBLIGATOIRE:
          {
            "score": number (0-100),
            "reasons": ["1-2 phrases selon cas détecté"],
            "sentiment_analysis": "positive|neutral|negative", 
            "preference_match": number (0-1),
            "quality_prediction": number (0-1)
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    console.error('Empty AI response content');
    throw new Error('Empty AI response');
  }

  // Log the raw content for debugging
  console.log('Raw AI response:', content);

  try {
    // Clean the content to extract JSON if wrapped in markdown or extra text
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Try to find JSON within the content
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonContent);
    
    // Validate required fields
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.reasons)) {
      console.error('Invalid AI response structure:', parsed);
      throw new Error('Missing required fields in AI response');
    }

    // Ensure score is within valid range
    parsed.score = Math.max(0, Math.min(100, parsed.score));
    
    // Ensure reasons array has max 5 elements if needed for comprehensive explanations
    parsed.reasons = parsed.reasons.slice(0, 5).filter(r => typeof r === 'string');
    
    return parsed;
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    console.error('Content that failed to parse:', content);
    throw new Error('Invalid AI response format');
  }
}

function createAnalysisPrompt(restaurant: Restaurant, preferences: UserPreferences, language: string = 'fr'): string {
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);
  const isMealTimeMatch = preferences.favorite_meal_times?.includes(currentMealTime) || false;
  
  // Calculer les correspondances pour aide au scoring
  const cuisineMatches = preferences.cuisine_preferences?.filter(pref => 
    restaurant.cuisine_type?.includes(pref)
  ) || [];
  const budgetMatch = preferences.price_range === restaurant.price_range;
  const popularityScore = (restaurant.profile_views || 0) + (restaurant.menu_views || 0);

  return `
🎯 MISSION: Analyser la compatibilité restaurant-utilisateur selon la hiérarchie de priorités

📊 RESTAURANT À ANALYSER:
• Nom: ${restaurant.name}
• Cuisine: ${restaurant.cuisine_type?.join(', ') || 'Non spécifié'}
• Prix: ${restaurant.price_range || 'Non spécifié'}
• Description: ${restaurant.description || 'Aucune'}
• Restrictions acceptées: ${restaurant.dietary_restrictions?.join(', ') || 'Non spécifié'}
• Allergènes présents: ${restaurant.allergens?.join(', ') || 'Non spécifié'}
• Popularité: ${popularityScore} vues totales
• Notes: ${restaurant.rating_count || 0} avis (moyenne: ${restaurant.average_rating || 'N/A'})

👤 PROFIL UTILISATEUR:
• Cuisines préférées: ${preferences.cuisine_preferences?.join(', ') || 'Aucune préférence'}
• Budget souhaité: ${preferences.price_range || 'Flexible'}
• Restrictions alimentaires: ${preferences.dietary_restrictions?.join(', ') || 'Aucune'}
• Allergènes à éviter: ${preferences.allergens?.join(', ') || 'Aucun'}
• Moments de repas favoris: ${preferences.favorite_meal_times?.join(', ') || 'Flexible'}
• Rayon de livraison: ${preferences.delivery_radius || 'Non spécifié'} km

⏰ CONTEXTE ACTUEL:
• Heure: ${currentHour}h (période: ${currentMealTime})
• Timing optimal: ${isMealTimeMatch ? '✅ OUI' : '❌ NON'}

🔍 CORRESPONDANCES DÉTECTÉES PAR CATÉGORIE:

1. 🔒 RESTRICTIONS/ALLERGÈNES: ${checkSafetyCompatibility(restaurant, preferences)}
2. 🍽️ CUISINES: ${cuisineMatches.length > 0 ? `✅ ${cuisineMatches.join(', ')} (${cuisineMatches.length} correspondance${cuisineMatches.length > 1 ? 's' : ''})` : '❌ Aucune'}
3. ⏰ MOMENTS: ${isMealTimeMatch ? '✅ Compatible avec tes horaires' : '❌ Pas optimal'}
4. 📍 LOCALISATION: ${preferences.delivery_radius ? '🔍 À analyser selon rayon' : '❌ Non définie'}
5. 💰 BUDGET: ${budgetMatch ? '✅ Compatible' : '❌ Différent'}
6. 🎉 PROMOTIONS: 🔍 À vérifier

🎯 DÉTECTION DE CAS:
- Nombre de cuisines matchant: ${cuisineMatches.length}
- Nombre de restrictions: ${preferences.dietary_restrictions?.length || 0}
- Nombre d'allergènes: ${preferences.allergens?.length || 0}
- Nombre de moments favoris: ${preferences.favorite_meal_times?.length || 0}

🎯 INSTRUCTIONS FINALES:
Applique la logique CAS 1 ou CAS 2 selon le nombre de critères par catégorie.
Respecte l'ordre de priorité strict et les phrases exactes définies.
  `;
}

function checkSafetyCompatibility(restaurant: Restaurant, preferences: UserPreferences): string {
  // Check dietary restrictions compatibility
  if (preferences?.dietary_restrictions?.length && restaurant.dietary_restrictions?.length) {
    const compatible = preferences.dietary_restrictions.some(restriction =>
      restaurant.dietary_restrictions!.includes(restriction)
    );
    if (compatible) return '✅ Restrictions respectées';
    else return '⚠️ Restrictions non respectées';
  }
  
  // Check allergens safety
  if (preferences?.allergens?.length && restaurant.allergens?.length) {
    const hasConflict = preferences.allergens.some(allergen =>
      restaurant.allergens!.includes(allergen)
    );
    if (!hasConflict) return '✅ Sécuritaire (allergènes)';
    else return '⚠️ Allergènes présents';
  }
  
  // Si pas de restrictions/allergènes = PARFAIT (plus de choix disponibles)
  if (!preferences?.dietary_restrictions?.length && !preferences?.allergens?.length) {
    return '✅ AUCUNE restriction = Tous les plats disponibles';
  }
  
  // Si utilisateur a des restrictions mais restaurant ne les spécifie pas
  if (preferences?.dietary_restrictions?.length && !restaurant.dietary_restrictions?.length) {
    return '⚠️ Restrictions utilisateur non confirmées par restaurant';
  }
  
  // Si utilisateur a des allergènes mais restaurant ne les spécifie pas
  if (preferences?.allergens?.length && !restaurant.allergens?.length) {
    return '⚠️ Allergènes utilisateur non confirmés par restaurant';
  }
  
  return '✅ Sécurité alimentaire OK';
}

function getCurrentMealTime(hour: number): string {
  if (hour >= 6 && hour < 11) return 'Déjeuner / Brunch';
  if (hour >= 11 && hour < 15) return 'Déjeuner rapide';
  if (hour >= 15 && hour < 17) return 'Collation';
  if (hour >= 17 && hour < 22) return 'Dîner / Souper';
  if (hour >= 22 || hour < 2) return 'Repas tardif';
  return 'Détox';
}

function calculateFallbackScore(restaurant: Restaurant, preferences: UserPreferences): number {
  let score = 40; // Score de base plus élevé - tous les restaurants ont une valeur
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);

  // 1. Bonus sécurité alimentaire (pas de restrictions = plus de choix)
  if (!preferences?.dietary_restrictions?.length && !preferences?.allergens?.length) {
    score += 20; // Bonus pour flexibilité alimentaire
  }

  // 2. Correspondance cuisine (30 points max)
  if (preferences.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
    const exactMatches = restaurant.cuisine_type.filter(cuisine =>
      preferences.cuisine_preferences!.includes(cuisine)
    );
    if (exactMatches.length > 0) {
      score += Math.min(exactMatches.length * 15, 30);
    }
  }

  // 3. Correspondance budget (20 points)  
  if (preferences.price_range && restaurant.price_range) {
    if (preferences.price_range === restaurant.price_range) {
      score += 20;
    } else {
      // Bonus partiel si budget compatible (restaurant moins cher)
      const priceOrder = ['$', '$$', '$$$', '$$$$'];
      const userIndex = priceOrder.indexOf(preferences.price_range);
      const restaurantIndex = priceOrder.indexOf(restaurant.price_range);
      
      if (restaurantIndex !== -1 && userIndex !== -1 && restaurantIndex <= userIndex) {
        score += 10; // Demi-points pour compatible mais pas exact
      }
    }
  }

  // 4. Timing optimal (10 points)
  if (preferences.favorite_meal_times?.includes(currentMealTime)) {
    score += 10;
  }

  // 5. Qualité et popularité (10 points max)
  if (restaurant.average_rating && restaurant.rating_count) {
    const qualityScore = (restaurant.average_rating / 5) * 5;
    const trustScore = Math.min(restaurant.rating_count / 10, 3);
    const popularityScore = Math.min((restaurant.profile_views || 0) / 100, 2);
    score += Math.min(qualityScore + trustScore + popularityScore, 10);
  }

  return Math.min(Math.round(score), 100);
}

// Phrases prédéfinies pour les explications - TOUTES LES PRÉFÉRENCES
const EXPLANATION_PHRASES = {
  fr: {
    // 1. RESTRICTIONS ALIMENTAIRES (priorité santé)
    dietary_restrictions: "Adapté à tes préférences végétariennes",
    dietary_restrictions_vegan: "Adapté à tes préférences véganes", 
    dietary_restrictions_glutenfree: "Adapté à tes préférences sans gluten",
    dietary_restrictions_halal: "Adapté à tes préférences halal",
    dietary_restrictions_kosher: "Adapté à tes préférences casher",
    
    // 2. ALLERGÈNES (sécurité alimentaire)
    allergens_safe: "Sans tes allergènes déclarés",
    allergens_nuts: "Sans arachides comme tu le souhaites",
    allergens_dairy: "Sans produits laitiers pour toi",
    allergens_seafood: "Sans fruits de mer selon tes besoins",
    allergens_gluten: "Sans gluten pour ta santé",
    
    // 3. CUISINES PRÉFÉRÉES 
    cuisine_favorite: (cuisine: string) => `Parce que tu aimes la cuisine ${cuisine.toLowerCase()}`,
    cuisine_multiple: (cuisines: string[]) => `Parce que tu aimes la cuisine ${cuisines.slice(0, 3).join(', ')}`,
    
    // 4. MOMENTS FAVORIS (timing)
    timing_perfect: "Ouvert pour tes moments favoris",
    timing_breakfast: "Ouvert pour le déjeuner/brunch",
    timing_lunch: "Ouvert pour le dîner rapide", 
    timing_dinner: "Ouvert pour le souper",
    timing_late: "Ouvert pour les repas tardifs",
    
    // 5. LOCALISATION (rue + distance)
    location_same_street: "Sur votre rue à Montréal",
    location_neighborhood: "Dans votre quartier à Montréal",
    location_main_artery: "Sur la même artère principale",
    location_close: "À moins de 2 km de chez toi",
    location_within_radius: (radius: number) => `Dans ton rayon de ${radius} km`,
    location_delivery_zone: "Dans ta zone de livraison préférée",
    
    // 6. BUDGET (gamme de prix)
    budget_perfect: (range: string) => `Respecte ton budget ${range}`,
    budget_affordable: "Dans tes moyens financiers",
    budget_premium: "Correspond à ton budget premium",
    
    // 7. PROMOTIONS (bonus)
    promo_active: "En promo aujourd'hui",
    promo_special: "Offre spéciale disponible",
    promo_discount: (percent: number) => `${percent}% de réduction active`,
    
    // 8. DÉCOUVERTE (fallback)
    discovery: "Nouvelle découverte recommandée",
    discovery_popular: "Populaire dans ton secteur",
    discovery_trending: "Tendance du moment"
  },
  en: {
    // 1. DIETARY RESTRICTIONS
    dietary_restrictions: "Fits your vegetarian preferences",
    dietary_restrictions_vegan: "Fits your vegan preferences",
    dietary_restrictions_glutenfree: "Fits your gluten-free preferences",
    dietary_restrictions_halal: "Fits your halal preferences", 
    dietary_restrictions_kosher: "Fits your kosher preferences",
    
    // 2. ALLERGENS
    allergens_safe: "Safe from your declared allergens",
    allergens_nuts: "Nut-free as you requested",
    allergens_dairy: "Dairy-free for you",
    allergens_seafood: "Seafood-free as needed",
    allergens_gluten: "Gluten-free for your health",
    
    // 3. PREFERRED CUISINES
    cuisine_favorite: (cuisine: string) => `Because you love ${cuisine.toLowerCase()} cuisine`,
    cuisine_multiple: (cuisines: string[]) => `Because you love ${cuisines.slice(0, 3).join(', ')} cuisine`,
    
    // 4. FAVORITE MEAL TIMES
    timing_perfect: "Open for your favorite times",
    timing_breakfast: "Open for breakfast/brunch",
    timing_lunch: "Open for quick lunch",
    timing_dinner: "Open for dinner",
    timing_late: "Open for late meals",
    
    // 5. LOCATION
    location_same_street: "On your street in Montreal",
    location_neighborhood: "In your Montreal neighborhood", 
    location_main_artery: "On the same main artery",
    location_close: "Less than 2 km from you",
    location_within_radius: (radius: number) => `Within your ${radius} km radius`,
    location_delivery_zone: "In your preferred delivery zone",
    
    // 6. BUDGET
    budget_perfect: (range: string) => `Fits your ${range} budget`,
    budget_affordable: "Within your price range",
    budget_premium: "Matches your premium budget",
    
    // 7. PROMOTIONS
    promo_active: "On sale today",
    promo_special: "Special offer available",
    promo_discount: (percent: number) => `${percent}% discount active`,
    
    // 8. DISCOVERY
    discovery: "New discovery recommended",
    discovery_popular: "Popular in your area",
    discovery_trending: "Currently trending"
  }
};

function generateFallbackReasons(restaurant: Restaurant, preferences: UserPreferences, language: string = 'fr'): string[] {
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);
  const phrases = EXPLANATION_PHRASES[language as keyof typeof EXPLANATION_PHRASES] || EXPLANATION_PHRASES.fr;

  // Hiérarchie de priorités selon les spécifications
  
  // 1. RESTRICTIONS / ALLERGÈNES (sécurité d'abord)
  if (preferences?.dietary_restrictions?.length && restaurant.dietary_restrictions?.length) {
    const hasCompatibleRestrictions = preferences.dietary_restrictions.some(restriction =>
      restaurant.dietary_restrictions!.includes(restriction)
    );
    if (hasCompatibleRestrictions) {
      if (preferences.dietary_restrictions.includes('Végétarien')) {
        return [phrases.dietary_restrictions];
      } else if (preferences.dietary_restrictions.includes('Végan')) {
        return [phrases.dietary_restrictions_vegan];
      } else if (preferences.dietary_restrictions.includes('Sans gluten')) {
        return [phrases.dietary_restrictions_glutenfree];
      } else {
        return [phrases.dietary_restrictions];
      }
    }
  }

  // Vérifier les allergènes
  if (preferences?.allergens?.length && restaurant.allergens?.length) {
    const hasConflictingAllergens = preferences.allergens.some(allergen =>
      restaurant.allergens!.includes(allergen)
    );
    if (!hasConflictingAllergens) {
      return [phrases.allergens_safe];
    }
  }

  // 2. CUISINE PRÉFÉRÉE (plaisir principal)
  if (preferences?.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
    const matchingCuisines = restaurant.cuisine_type.filter(cuisine =>
      preferences.cuisine_preferences!.includes(cuisine)
    );
    if (matchingCuisines.length > 0) {
      const cuisineName = matchingCuisines[0];
      return [typeof phrases.cuisine_favorite === 'function' 
        ? phrases.cuisine_favorite(cuisineName) 
        : `Cuisine ${cuisineName} appréciée`];
    }
  }

  // 3. MOMENT CHOISI (pertinence temporelle)
  if (preferences?.favorite_meal_times?.includes(currentMealTime)) {
    return [phrases.timing_perfect];
  }

  // 4. LOCALISATION (distance - matching basé sur les rues de Montréal)
  const locationMatch = calculateLocationMatch(restaurant, preferences, language);
  if (locationMatch.match) {
    return [locationMatch.phrase];
  }

  // 5. BUDGET (respect financier) - LOGIQUE AMÉLIORÉE
  const budgetMatch = calculateBudgetMatch(restaurant, preferences, language);
  if (budgetMatch.match) {
    return [budgetMatch.phrase];
  }

  // 6. ZONE DE LIVRAISON (rayon optimisé) - LOGIQUE AMÉLIORÉE  
  const deliveryMatch = calculateDeliveryMatch(restaurant, preferences, language);
  if (deliveryMatch.match) {
    return [deliveryMatch.phrase];
  }

  // 6. PROMO (bonus - à implémenter avec les données d'offres)
  // Cette logique sera ajoutée quand les données de promotions seront disponibles

  // Default si aucune correspondance
  return [phrases.discovery];
}

// Fonction pour calculer le matching géographique basé sur les rues de Montréal
function calculateLocationMatch(restaurant: Restaurant, preferences: UserPreferences, language: string = 'fr'): { match: boolean, phrase: string } {
  const phrases = EXPLANATION_PHRASES[language as keyof typeof EXPLANATION_PHRASES] || EXPLANATION_PHRASES.fr;
  
  // Si pas d'adresse ou de préférence de rue, pas de match
  if (!restaurant.address || !preferences.street) {
    return { match: false, phrase: '' };
  }

  // Extraire les noms de rues des adresses
  const restaurantStreet = extractStreetName(restaurant.address);
  const userStreet = extractStreetName(preferences.street);
  
  if (!restaurantStreet || !userStreet) {
    return { match: false, phrase: '' };
  }

  // Match exact de rue
  if (restaurantStreet === userStreet) {
    return { 
      match: true, 
      phrase: language === 'en' ? "On your street in Montreal" : "Sur votre rue à Montréal" 
    };
  }

  // Match de quartier/proximité pour rues populaires de Montréal
  const proximityMatch = checkMontrealProximity(restaurantStreet, userStreet, language);
  if (proximityMatch.isClose) {
    return { match: true, phrase: proximityMatch.phrase };
  }

  // Rayon de livraison générique
  if (preferences.delivery_radius && preferences.delivery_radius <= 2) {
    return { match: true, phrase: phrases.location_close };
  }
  
  // Vérifier le rayon de livraison étendu
  if (preferences.delivery_radius && preferences.delivery_radius > 2) {
    return { 
      match: true, 
      phrase: typeof phrases.location_within_radius === 'function' 
        ? phrases.location_within_radius(preferences.delivery_radius)
        : (language === 'en' 
            ? `Within your ${preferences.delivery_radius} km radius`
            : `Dans votre rayon de ${preferences.delivery_radius} km`)
    };
  }

  return { match: false, phrase: '' };
}

// Fonction pour calculer le matching budgétaire intelligent
function calculateBudgetMatch(restaurant: Restaurant, preferences: UserPreferences, language: string = 'fr'): { match: boolean, phrase: string } {
  const phrases = EXPLANATION_PHRASES[language as keyof typeof EXPLANATION_PHRASES] || EXPLANATION_PHRASES.fr;
  
  if (!preferences.price_range || !restaurant.price_range) {
    return { match: false, phrase: '' };
  }

  // Match exact de prix
  if (preferences.price_range === restaurant.price_range) {
    return { 
      match: true, 
      phrase: typeof phrases.budget_perfect === 'function' 
        ? phrases.budget_perfect(restaurant.price_range) 
        : (language === 'en' 
            ? `Fits your ${restaurant.price_range} budget`
            : `Respecte votre budget ${restaurant.price_range}`)
    };
  }

  // Match de compatibilité budgétaire (restaurant moins cher que préférence)
  const priceOrder = ['$', '$$', '$$$', '$$$$'];
  const userIndex = priceOrder.indexOf(preferences.price_range);
  const restaurantIndex = priceOrder.indexOf(restaurant.price_range);

  if (restaurantIndex !== -1 && userIndex !== -1 && restaurantIndex <= userIndex) {
    return { 
      match: true, 
      phrase: phrases.budget_affordable || (language === 'en' ? "Within your price range" : "Dans vos moyens financiers")
    };
  }

  return { match: false, phrase: '' };
}

// Fonction pour calculer le matching de zone de livraison
function calculateDeliveryMatch(restaurant: Restaurant, preferences: UserPreferences, language: string = 'fr'): { match: boolean, phrase: string } {
  const phrases = EXPLANATION_PHRASES[language as keyof typeof EXPLANATION_PHRASES] || EXPLANATION_PHRASES.fr;
  
  if (!preferences.delivery_radius || !restaurant.delivery_radius) {
    return { match: false, phrase: '' };
  }

  // Vérifier si l'utilisateur est dans la zone de livraison du restaurant
  if (preferences.delivery_radius <= restaurant.delivery_radius) {
    if (preferences.delivery_radius <= 1) {
      return { 
        match: true, 
        phrase: language === 'en' ? "In your immediate delivery zone" : "Dans votre zone de livraison immédiate" 
      };
    } else if (preferences.delivery_radius <= 3) {
      return { 
        match: true, 
        phrase: phrases.location_delivery_zone || (language === 'en' ? "In your delivery zone" : "Dans votre zone de livraison")
      };
    } else {
      return { 
        match: true, 
        phrase: typeof phrases.location_within_radius === 'function' 
          ? phrases.location_within_radius(preferences.delivery_radius)
          : (language === 'en' 
              ? `Delivery available within your ${preferences.delivery_radius} km radius`
              : `Livraison possible dans votre rayon de ${preferences.delivery_radius} km`)
      };
    }
  }

  return { match: false, phrase: '' };
}

// Fonction pour extraire le nom de la rue d'une adresse complète
function extractStreetName(address: string): string | null {
  if (!address) return null;
  
  // Patterns pour extraire les rues de Montréal
  const streetPatterns = [
    /(\d+\s+)?(Rue\s+[^,]+)/i,
    /(\d+\s+)?(Boulevard\s+[^,]+)/i,
    /(\d+\s+)?(Avenue\s+[^,]+)/i,
    /(\d+\s+)?(Place\s+[^,]+)/i,
    /(\d+\s+)?(Chemin\s+[^,]+)/i
  ];

  for (const pattern of streetPatterns) {
    const match = address.match(pattern);
    if (match && match[2]) {
      return match[2].trim();
    }
  }

  // Fallback: prendre la première partie avant la virgule (sans numéro)
  const parts = address.split(',')[0].trim();
  const withoutNumber = parts.replace(/^\d+\s+/, '');
  return withoutNumber || null;
}

// Fonction pour vérifier la proximité entre rues de Montréal
function checkMontrealProximity(street1: string, street2: string, language: string = 'fr'): { isClose: boolean, phrase: string } {
  const phrases = EXPLANATION_PHRASES[language as keyof typeof EXPLANATION_PHRASES] || EXPLANATION_PHRASES.fr;
  
  // Normaliser les noms de rues
  const normalize = (str: string) => str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const norm1 = normalize(street1);
  const norm2 = normalize(street2);

  // Quartiers et groupes de rues proches
  const proximityGroups = [
    // Plateau Mont-Royal
    ['rue saint-denis', 'boulevard saint-laurent', 'avenue du parc', 'rue rachel', 'rue duluth', 'avenue mont-royal'],
    // Centre-ville
    ['rue sainte-catherine', 'boulevard de maisonneuve', 'rue sherbrooke', 'rue peel', 'rue guy', 'rue crescent'],
    // Mile End
    ['rue saint-viateur', 'avenue fairmount', 'rue bernard', 'avenue laurier ouest', 'rue van horne'],
    // Rosemont
    ['rue beaubien', 'rue masson', 'boulevard pie-ix', 'avenue papineau'],
    // Outremont
    ['avenue laurier', 'rue bernard', 'avenue du parc', 'rue hutchison']
  ];

  // Vérifier si les deux rues sont dans le même groupe de proximité
  for (const group of proximityGroups) {
    const street1InGroup = group.some(street => norm1.includes(normalize(street)));
    const street2InGroup = group.some(street => norm2.includes(normalize(street)));
    
    if (street1InGroup && street2InGroup) {
      return { 
        isClose: true, 
        phrase: language === 'en' ? "In your Montreal neighborhood" : "Dans votre quartier à Montréal" 
      };
    }
  }

  // Vérifier si c'est la même rue principale (ex: Sherbrooke Est vs Sherbrooke Ouest)
  const mainStreets = ['sherbrooke', 'saint-denis', 'saint-laurent', 'notre-dame', 'sainte-catherine'];
  for (const mainStreet of mainStreets) {
    if (norm1.includes(mainStreet) && norm2.includes(mainStreet)) {
      return { 
        isClose: true, 
        phrase: language === 'en' ? "On the same main artery" : "Sur la même artère principale" 
      };
    }
  }

  return { isClose: false, phrase: '' };
}

async function logRecommendationInteraction(userId: string, recommendations: any[]) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logData = {
      user_id: userId,
      event_type: 'ai_recommendations_generated',
      event_details: {
        recommendations_count: recommendations.length,
        ai_powered: true,
        top_recommendation: recommendations[0]?.id,
        timestamp: new Date().toISOString()
      }
    };

    await supabase.from('security_audit_log').insert(logData);
  } catch (error) {
    console.error('Error logging recommendation interaction:', error);
  }
}