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

interface UserInteraction {
  restaurant_id: string;
  interaction_type: string;
  context_data?: any;
  created_at: string;
}

interface LearnedPreferences {
  cuisine_weights?: Record<string, number>;
  price_preferences?: Record<string, number>;
  dietary_scores?: Record<string, number>;
  context_preferences?: Record<string, number>;
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

    const { restaurants, preferences, userId, userInteractions, learnedPreferences } = await req.json();

    if (!restaurants || !Array.isArray(restaurants)) {
      throw new Error('Restaurants array is required');
    }

    console.log(`Processing AI recommendations for ${restaurants.length} restaurants`);

    // Analyse sémantique et scoring IA pour chaque restaurant
    const aiScoredRestaurants = await Promise.all(
      restaurants.map(async (restaurant: Restaurant) => {
        try {
          const aiScore = await analyzeRestaurantWithAI(
            restaurant, 
            preferences, 
            userInteractions || [], 
            learnedPreferences || {}, 
            openAIApiKey
          );
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
  userInteractions: UserInteraction[],
  learnedPreferences: LearnedPreferences,
  apiKey: string
): Promise<AIScore> {
  const prompt = createAnalysisPrompt(restaurant, preferences, userInteractions, learnedPreferences);

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

          MISSION: Analyser la compatibilité entre un restaurant et les préférences utilisateur en utilisant l'APPRENTISSAGE ADAPTATIF.
          
          CRITÈRES D'ANALYSE INTELLIGENT (ordre d'importance):
          1. 🧠 APPRENTISSAGE (35%): Poids dynamiques basés sur interactions passées
          2. 🍽️ CUISINE (30%): Correspondance avec préférences déclarées + apprises  
          3. 💰 BUDGET (20%): Prix préféré + historique d'acceptation
          4. ⏰ TIMING (10%): Moment optimal + habitudes apprises
          5. 🌟 QUALITÉ (5%): Notes existantes pondérées par profil utilisateur

          RAISONS AUTORISÉES (maximum 2, courtes et impactantes):
          - "Cuisine favorite" (si cuisine exactement préférée)
          - "Prix idéal" (si budget correspond parfaitement)
          - "Moment parfait" (si horaire optimal pour préférences)
          - "Très populaire" (si excellentes notes/beaucoup de vues)
          - "Nouvelle découverte" (si diversification recommandée)
          
          SCORING ADAPTATIF INTELLIGENT:
          - Score base: 15 points
          - Apprentissage cuisine (poids dynamique): +20-35 points
          - Préférences déclarées: +15-30 points  
          - Historique budget compatible: +10-20 points
          - Timing appris: +5-15 points
          - Qualité personnalisée: +5-10 points
          - Facteur découverte: +0-15 points (selon profil explorateur)
          
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

function createAnalysisPrompt(
  restaurant: Restaurant, 
  preferences: UserPreferences, 
  userInteractions: UserInteraction[], 
  learnedPreferences: LearnedPreferences
): string {
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);
  const isMealTimeMatch = preferences.favorite_meal_times?.includes(currentMealTime) || false;
  
  // Analyser l'historique d'interactions pour apprentissage
  const restaurantInteractions = userInteractions.filter(i => i.restaurant_id === restaurant.id);
  const likedInteractions = userInteractions.filter(i => 
    i.interaction_type === 'swipe_right' || i.interaction_type === 'favorite'
  );
  const dislikedInteractions = userInteractions.filter(i => 
    i.interaction_type === 'swipe_left'
  );

  // Calculer les poids appris pour ce type de restaurant
  const learnedCuisineWeights = restaurant.cuisine_type?.map(cuisine => 
    learnedPreferences.cuisine_weights?.[cuisine] || 0.5
  ) || [];
  
  const learnedPriceWeight = learnedPreferences.price_preferences?.[restaurant.price_range || ''] || 0.5;
  
  // Correspondances traditionnelles + apprises
  const cuisineMatches = preferences.cuisine_preferences?.filter(pref => 
    restaurant.cuisine_type?.includes(pref)
  ) || [];
  const budgetMatch = preferences.price_range === restaurant.price_range;
  const popularityScore = (restaurant.profile_views || 0) + (restaurant.menu_views || 0);

  // Analyser les tendances d'interactions similaires
  const similarCuisineInteractions = likedInteractions.filter(i => {
    const contextData = i.context_data || {};
    const interactionCuisines = contextData.cuisine_type || [];
    return restaurant.cuisine_type?.some(c => interactionCuisines.includes(c));
  });

  const similarPriceInteractions = likedInteractions.filter(i => {
    const contextData = i.context_data || {};
    return contextData.price_range === restaurant.price_range;
  });

  return `
🎯 MISSION: Analyser la compatibilité restaurant-utilisateur avec APPRENTISSAGE ADAPTATIF

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

🧠 DONNÉES D'APPRENTISSAGE:
• Interactions totales: ${userInteractions.length}
• Restaurants aimés similaires (cuisine): ${similarCuisineInteractions.length}
• Restaurants aimés similaires (prix): ${similarPriceInteractions.length}
• Interactions précédentes avec ce restaurant: ${restaurantInteractions.length}
• Poids appris cuisine: ${learnedCuisineWeights.length > 0 ? learnedCuisineWeights.map(w => Math.round(w * 100) + '%').join(', ') : 'Aucun'}
• Poids appris prix (${restaurant.price_range}): ${Math.round(learnedPriceWeight * 100)}%

📈 TENDANCES COMPORTEMENTALES:
• Total swipes droite: ${likedInteractions.length}
• Total swipes gauche: ${dislikedInteractions.length}
• Ratio exploration/exploitation: ${likedInteractions.length > 0 ? Math.round((dislikedInteractions.length / likedInteractions.length) * 100) + '%' : 'N/A'}

🎯 INSTRUCTIONS FINALES:
Calcule un score ADAPTATIF intelligent (0-100) en privilégiant dans cet ordre:

1. 🧠 APPRENTISSAGE (35% max): Utilise les poids appris des cuisines et prix pour ajuster le score
2. 🍽️ PRÉFÉRENCES DÉCLARÉES (30% max): Correspondances cuisine/restrictions explicites  
3. 💰 HISTORIQUE BUDGET (20% max): Compatible + historique d'acceptation de ce prix
4. ⏰ CONTEXTE TEMPOREL (10% max): Timing + habitudes apprises
5. 🌟 QUALITÉ PERSONNALISÉE (5% max): Notes pondérées par profil utilisateur

BONUS ADAPTATIFS:
- Si beaucoup d'interactions similaires aimées: +10-15 points
- Si utilisateur explorateur (ratio swipe élevé): bonus découverte +5-10 points  
- Si restaurant jamais essayé mais profil compatible: bonus curiosité +5 points

Choisis 1-2 raisons PERSONNALISÉES qui reflètent l'apprentissage:
- "Correspond à vos goûts" (si poids appris élevé)
- "Basé sur vos choix récents" (si interactions similaires)
- "Nouveau style pour vous" (si diversification recommandée)
- "Prix habituel" (si historique prix compatible)
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
  let score = 20; // Score de base
  const currentHour = new Date().getHours();
  const currentMealTime = getCurrentMealTime(currentHour);

  // 1. Correspondance cuisine (40% - priorité maximale)
  if (preferences.cuisine_preferences?.length && restaurant.cuisine_type?.length) {
    const exactMatches = restaurant.cuisine_type.filter(cuisine =>
      preferences.cuisine_preferences!.includes(cuisine)
    );
    if (exactMatches.length > 0) {
      // Score progressif selon nombre de correspondances
      score += Math.min(exactMatches.length * 15, 40);
    }
  }

  // 2. Correspondance budget (25%)  
  if (preferences.price_range === restaurant.price_range) {
    score += 25;
  }

  // 3. Timing optimal (20%)
  if (preferences.favorite_meal_times?.includes(currentMealTime)) {
    score += 20;
  }

  // 4. Qualité et notes (10%)
  if (restaurant.average_rating && restaurant.rating_count) {
    const qualityScore = (restaurant.average_rating / 5) * 8;
    const trustScore = Math.min(restaurant.rating_count / 10, 2); // Bonus fiabilité
    score += qualityScore + trustScore;
  }

  // 5. Popularité et découverte (5%)
  const popularity = (restaurant.profile_views || 0) + (restaurant.menu_views || 0);
  if (popularity > 100) {
    score += 3; // Restaurant populaire
  } else {
    score += 2; // Bonus découverte
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