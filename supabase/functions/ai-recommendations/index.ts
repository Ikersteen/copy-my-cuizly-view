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
      await logRecommendationInteraction(userId, sortedRestaurants.slice(0, 6));
    }

    return new Response(JSON.stringify({
      recommendations: sortedRestaurants.slice(0, 6),
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
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en recommandations de restaurants. Analyse les restaurants en fonction des préférences utilisateur et fournis un scoring détaillé en JSON.
          
          IMPORTANT: Tient compte des moments de repas favoris pour adapter tes recommandations selon l'heure actuelle.
          
          Format de réponse requis (JSON uniquement, sans markdown):
          {
            "score": number (0-100),
            "reasons": ["raison1", "raison2", ...],
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
      max_tokens: 500
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

  return `
Analyse ce restaurant pour les recommandations:

Restaurant:
- Nom: ${restaurant.name}
- Description: ${restaurant.description || 'Non spécifiée'}
- Types de cuisine: ${restaurant.cuisine_type?.join(', ') || 'Non spécifiés'}
- Gamme de prix: ${restaurant.price_range || 'Non spécifiée'}
- Note moyenne: ${restaurant.average_rating || 'Pas de note'}
- Nombre de notes: ${restaurant.rating_count || 0}
- Vues de profil: ${restaurant.profile_views || 0}
- Vues de menu: ${restaurant.menu_views || 0}

Préférences utilisateur:
- Cuisines préférées: ${preferences.cuisine_preferences?.join(', ') || 'Aucune spécifiée'}
- Budget: ${preferences.price_range || 'Non spécifié'}
- Restrictions alimentaires: ${preferences.dietary_restrictions?.join(', ') || 'Aucune'}
- Allergènes: ${preferences.allergens?.join(', ') || 'Aucun'}
- Moments de repas favoris: ${preferences.favorite_meal_times?.join(', ') || 'Non spécifiés'}
- Rayon de livraison: ${preferences.delivery_radius || 'Non spécifié'} km

Contexte temporel:
- Heure actuelle: ${currentHour}h (${currentMealTime})
- Correspond aux préférences de repas: ${isMealTimeMatch ? 'OUI' : 'NON'}

Analyse sémantique (pondération dynamique):
1. Correspondance cuisine et préférences (30%)
2. Adéquation avec le moment de repas actuel (25%)
3. Qualité basée sur les notes et popularité (25%)
4. Analyse de sentiment de la description (15%)
5. Respect des restrictions alimentaires (5%)

CRITÈRES SPÉCIAUX:
- Si c'est un moment de repas favori: +15 points bonus
- Si restrictions alimentaires respectées: +10 points bonus  
- Si cuisine très appréciée: +10 points bonus

Fournis un score total sur 100 et des raisons spécifiques incluant l'adéquation temporelle.
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
  let score = 0;
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);

  // Correspondance cuisine (30%)
  if (preferences.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
    const matches = restaurant.cuisine_type.filter(cuisine =>
      preferences.cuisine_preferences!.includes(cuisine)
    ).length;
    score += (matches / preferences.cuisine_preferences.length) * 30;
  }

  // Moment de repas (25%)
  if (preferences.favorite_meal_times?.includes(currentMealTime)) {
    score += 25;
  }

  // Prix (20%)
  if (preferences.price_range === restaurant.price_range) {
    score += 20;
  }

  // Qualité (15%)
  if (restaurant.average_rating) {
    score += (restaurant.average_rating / 5) * 15;
  }

  // Popularité (10%)
  const popularity = (restaurant.profile_views || 0) + (restaurant.menu_views || 0);
  score += Math.min(popularity / 100, 1) * 10;

  return Math.round(score);
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