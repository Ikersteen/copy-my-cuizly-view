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

    // Check if user has any meaningful preferences defined
    const hasPreferences = !!(
      preferences?.cuisine_preferences?.length ||
      preferences?.price_range ||
      preferences?.favorite_meal_times?.length ||
      preferences?.dietary_restrictions?.length
    );

    // If no preferences are defined, return empty recommendations
    if (!hasPreferences) {
      console.log('No user preferences found - returning empty AI recommendations');
      return new Response(JSON.stringify({
        recommendations: [],
        total_analyzed: 0,
        ai_powered: true,
        message: 'No preferences defined'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing AI recommendations for ${restaurants.length} restaurants`);

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
      recommendations: sortedRestaurants.slice(0, 5),
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
    
    // Ensure reasons array has max 2 elements for new case logic (1-2 phrases)
    parsed.reasons = parsed.reasons.slice(0, 2).filter(r => typeof r === 'string');
    
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
  }
  
  // Check allergens safety
  if (preferences?.allergens?.length && restaurant.allergens?.length) {
    const hasConflict = preferences.allergens.some(allergen =>
      restaurant.allergens!.includes(allergen)
    );
    if (!hasConflict) return '✅ Sécuritaire (allergènes)';
    else return '⚠️ Allergènes présents';
  }
  
  return '❌ Sécurité non vérifiable';
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
  // Check if user has any meaningful preferences defined
  const hasPreferences = !!(
    preferences?.cuisine_preferences?.length ||
    preferences?.price_range ||
    preferences?.favorite_meal_times?.length ||
    preferences?.dietary_restrictions?.length
  );

  // If no preferences, return 0 score
  if (!hasPreferences) {
    return 0;
  }

  let score = 0; // Start from 0, only add points for matches
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);

  // 1. Correspondance cuisine (60% - priorité maximale)
  if (preferences.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
    const exactMatches = restaurant.cuisine_type.filter(cuisine =>
      preferences.cuisine_preferences!.includes(cuisine)
    );
    if (exactMatches.length > 0) {
      score += Math.min(exactMatches.length * 20, 60);
    }
  }

  // 2. Correspondance budget (25%)  
  if (preferences.price_range === restaurant.price_range) {
    score += 25;
  }

  // 3. Timing optimal (10%)
  if (preferences.favorite_meal_times?.includes(currentMealTime)) {
    score += 10;
  }

  // 4. Qualité et notes (5%)
  if (restaurant.average_rating && restaurant.rating_count) {
    const qualityScore = (restaurant.average_rating / 5) * 3;
    const trustScore = Math.min(restaurant.rating_count / 10, 2);
    score += qualityScore + trustScore;
  }

  return Math.min(Math.round(score), 100);
}

// Phrases prédéfinies pour les explications
const EXPLANATION_PHRASES = {
  fr: {
    dietary_restrictions: "Adapté à tes préférences végétariennes",
    dietary_restrictions_vegan: "Adapté à tes préférences véganes", 
    dietary_restrictions_glutenfree: "Adapté à tes préférences sans gluten",
    allergens_safe: "Sans tes allergènes déclarés",
    cuisine_favorite: (cuisine: string) => `Parce que tu aimes la cuisine ${cuisine.toLowerCase()}`,
    timing_perfect: "Ouvert au bon moment pour toi",
    location_close: "À moins de 2 km de chez toi",
    location_neighborhood: "Dans ton quartier préféré",
    budget_perfect: (range: string) => `Respecte ton budget ${range}`,
    promo_active: "En promo aujourd'hui",
    discovery: "Nouvelle découverte recommandée"
  },
  en: {
    dietary_restrictions: "Fits your vegetarian preferences",
    dietary_restrictions_vegan: "Fits your vegan preferences",
    dietary_restrictions_glutenfree: "Fits your gluten-free preferences", 
    allergens_safe: "Safe from your declared allergens",
    cuisine_favorite: (cuisine: string) => `Because you love ${cuisine.toLowerCase()} cuisine`,
    timing_perfect: "Open at the right time for you",
    location_close: "Less than 2 km from you",
    location_neighborhood: "In your favorite neighborhood",
    budget_perfect: (range: string) => `Fits your ${range} budget`,
    promo_active: "On sale today",
    discovery: "New discovery recommended"
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

  // 4. LOCALISATION (distance - à implémenter avec les données de distance)
  // Pour l'instant, on utilise une logique basique
  if (preferences?.delivery_radius && preferences.delivery_radius <= 2) {
    return [phrases.location_close];
  }

  // 5. BUDGET (respect financier)
  if (preferences?.price_range === restaurant.price_range && restaurant.price_range) {
    return [typeof phrases.budget_perfect === 'function' 
      ? phrases.budget_perfect(restaurant.price_range) 
      : `Budget ${restaurant.price_range} respecté`];
  }

  // 6. PROMO (bonus - à implémenter avec les données d'offres)
  // Cette logique sera ajoutée quand les données de promotions seront disponibles

  // Default si aucune correspondance
  return [phrases.discovery];
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