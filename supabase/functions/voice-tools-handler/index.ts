import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool_name, arguments: toolArgs, user_id } = await req.json();
    
    console.log(`🔧 Voice tool called: ${tool_name}`, toolArgs);

    switch (tool_name) {
      case 'get_recommendations':
        return await handleGetRecommendations(toolArgs, user_id);
      
      case 'get_user_preferences':
        return await handleGetUserPreferences(user_id);
      
      default:
        return new Response(JSON.stringify({ 
          error: `Unknown tool: ${tool_name}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('❌ Error in voice-tools-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGetRecommendations(args: any, userId: string) {
  try {
    const { cuisine_types, budget_range, location } = args;
    
    console.log('🍽️ Getting recommendations for voice request:', { cuisine_types, budget_range, location });

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError) {
      console.log('No user preferences found, using defaults');
    }

    // Get restaurants (simplified query for voice)
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(5);

    if (restError) {
      throw new Error('Failed to fetch restaurants');
    }

    // Call AI recommendations with voice-specific preferences
    const voicePreferences = {
      ...preferences,
      cuisine_types: cuisine_types || preferences?.cuisine_types || [],
      budget_range: budget_range || preferences?.budget_range || 'moderate',
      location: location || preferences?.location || 'Montreal'
    };

    const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-recommendations', {
      body: {
        restaurants,
        preferences: voicePreferences,
        userId,
        language: 'fr'
      }
    });

    if (aiError) {
      throw new Error('AI recommendations failed');
    }

    const recommendations = aiResult?.recommendations || [];
    
    const summary = recommendations.length > 0 
      ? `J'ai trouvé ${recommendations.length} super restos pour toi! ${recommendations[0].name} semble parfait avec un score de ${recommendations[0].ai_score}/100.`
      : 'Désolé, je n\'ai pas trouvé de resto qui correspond exactement. Veux-tu ajuster tes critères?';

    return new Response(JSON.stringify({
      success: true,
      recommendations,
      summary,
      count: recommendations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      summary: 'Oups, j\'ai eu un petit problème technique. Peux-tu réessayer?'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetUserPreferences(userId: string) {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Failed to fetch user preferences');
    }

    const summary = preferences 
      ? `Tes préférences: ${preferences.cuisine_types?.join(', ') || 'aucune cuisine spécifique'}, budget ${preferences.budget_range || 'modéré'}.`
      : 'Tu n\'as pas encore configuré tes préférences. Je peux t\'aider à le faire!';

    return new Response(JSON.stringify({
      success: true,
      preferences: preferences || {},
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error getting user preferences:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      summary: 'Je n\'arrive pas à accéder à tes préférences pour le moment.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}