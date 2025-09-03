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

    const { restaurants, preferences, userId } = await req.json();

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
          const aiScore = await analyzeRestaurantWithAI(restaurant, preferences, openAIApiKey);
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
          // Fallback au scoring traditionnel
          return {
            ...restaurant,
            ai_score: calculateFallbackScore(restaurant, preferences),
            ai_reasons: ['Analyse traditionnelle'],
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
      await logRecommendationInteraction(userId, sortedRestaurants.slice(0, 7));
    }

    return new Response(JSON.stringify({
      recommendations: sortedRestaurants.slice(0, 7),
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
  apiKey: string
): Promise<AIScore> {
  const prompt = createAnalysisPrompt(restaurant, preferences);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en recommandations de restaurants qui analyse intelligemment les correspondances utilisateur-restaurant.

          MISSION: Analyser la compatibilité entre un restaurant et les préférences utilisateur.
          
          CRITÈRES D'ANALYSE (par ordre d'importance):
          1. 🍽️ CUISINE (40%): Correspondance exacte avec préférences culinaires
          2. 💰 BUDGET (25%): Prix dans la fourchette préférée
          3. ⏰ TIMING (20%): Adéquation avec moment de repas actuel
          4. 🌟 QUALITÉ (10%): Notes et popularité existantes
          5. 🔍 DÉCOUVERTE (5%): Bonus pour diversité/nouveauté

          RAISONS AUTORISÉES (maximum 2, courtes et impactantes):
          - "Cuisine favorite" (si cuisine exactement préférée)
          - "Prix idéal" (si budget correspond parfaitement)
          - "Moment parfait" (si horaire optimal pour préférences)
          - "Très populaire" (si excellentes notes/beaucoup de vues)
          - "Nouvelle découverte" (si diversification recommandée)
          
          SCORING INTELLIGENT:
          - Score base: 20 points
          - Correspondance cuisine exacte: +30-40 points
          - Budget parfait: +15-25 points  
          - Timing optimal: +10-20 points
          - Qualité prouvée: +5-15 points
          - Bonus découverte: +5-10 points
          
          FORMAT JSON OBLIGATOIRE:
          {
            "score": number (0-100),
            "reasons": ["raison1", "raison2"],
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
      max_completion_tokens: 400
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    throw new Error('Invalid AI response format');
  }
}

function createAnalysisPrompt(restaurant: Restaurant, preferences: UserPreferences): string {
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
🎯 MISSION: Analyser la compatibilité restaurant-utilisateur

📊 RESTAURANT À ANALYSER:
• Nom: ${restaurant.name}
• Cuisine: ${restaurant.cuisine_type?.join(', ') || 'Non spécifié'}
• Prix: ${restaurant.price_range || 'Non spécifié'}
• Description: ${restaurant.description || 'Aucune'}
• Popularité: ${popularityScore} vues totales
• Notes: ${restaurant.rating_count || 0} avis (moyenne: ${restaurant.average_rating || 'N/A'})

👤 PROFIL UTILISATEUR:
• Cuisines préférées: ${preferences.cuisine_preferences?.join(', ') || 'Aucune préférence'}
• Budget souhaité: ${preferences.price_range || 'Flexible'}
• Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'Aucune'}
• Allergènes: ${preferences.allergens?.join(', ') || 'Aucun'}
• Moments de repas favoris: ${preferences.favorite_meal_times?.join(', ') || 'Flexible'}

⏰ CONTEXTE ACTUEL:
• Heure: ${currentHour}h (période: ${currentMealTime})
• Timing optimal: ${isMealTimeMatch ? '✅ OUI' : '❌ NON'}

🔍 CORRESPONDANCES DÉTECTÉES:
• Cuisine: ${cuisineMatches.length > 0 ? `✅ ${cuisineMatches.join(', ')}` : '❌ Aucune'}
• Budget: ${budgetMatch ? '✅ Compatible' : '❌ Différent'}
• Popularité: ${popularityScore > 50 ? '⭐ Populaire' : '🆕 À découvrir'}

🎯 INSTRUCTIONS FINALES:
Calcule un score de compatibilité intelligent (0-100) en privilégiant:
1. Les correspondances cuisine exactes (+40 max)
2. Le budget compatible (+25 max)
3. Le timing optimal (+20 max)
4. La qualité/popularité (+15 max)

Choisis 1-2 raisons courtes qui justifient le score calculé.
  `;
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