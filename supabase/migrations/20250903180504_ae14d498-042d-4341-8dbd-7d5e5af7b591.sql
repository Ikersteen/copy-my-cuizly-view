-- Table pour stocker les interactions utilisateur (swipes, favoris, etc.)
CREATE TABLE IF NOT EXISTS public.user_restaurant_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('swipe_right', 'swipe_left', 'favorite', 'unfavorite', 'profile_view', 'menu_view')),
  context_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, restaurant_id, interaction_type)
);

-- Enable RLS
ALTER TABLE public.user_restaurant_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own interactions"
ON public.user_restaurant_interactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX idx_user_restaurant_interactions_user_id ON public.user_restaurant_interactions(user_id);
CREATE INDEX idx_user_restaurant_interactions_restaurant_id ON public.user_restaurant_interactions(restaurant_id);
CREATE INDEX idx_user_restaurant_interactions_type ON public.user_restaurant_interactions(interaction_type);

-- Table pour stocker les préférences apprises par l'IA
CREATE TABLE IF NOT EXISTS public.user_learned_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cuisine_weights jsonb DEFAULT '{}', -- Ex: {"japonais": 0.8, "italien": 0.6}
  price_preferences jsonb DEFAULT '{}',
  dietary_scores jsonb DEFAULT '{}',
  context_preferences jsonb DEFAULT '{}', -- Préférences par moment, localisation, etc.
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learned_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own learned preferences"
ON public.user_learned_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour les préférences apprises
CREATE OR REPLACE FUNCTION public.update_learned_preferences(
  p_user_id uuid,
  p_restaurant_id uuid,
  p_interaction_type text,
  p_restaurant_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  learning_rate NUMERIC := 0.1; -- Vitesse d'apprentissage
  current_preferences jsonb;
  cuisine_types text[];
  price_range text;
BEGIN
  -- Récupérer les préférences actuelles
  SELECT cuisine_weights, price_preferences 
  INTO current_preferences
  FROM user_learned_preferences 
  WHERE user_id = p_user_id;
  
  -- Créer les préférences si elles n'existent pas
  IF current_preferences IS NULL THEN
    INSERT INTO user_learned_preferences (user_id, cuisine_weights, price_preferences)
    VALUES (p_user_id, '{}', '{}')
    ON CONFLICT (user_id) DO NOTHING;
    current_preferences := '{}';
  END IF;
  
  -- Extraire les données du restaurant
  cuisine_types := COALESCE((p_restaurant_data->>'cuisine_type')::text[], ARRAY[]::text[]);
  price_range := COALESCE(p_restaurant_data->>'price_range', '');
  
  -- Mettre à jour les poids selon le type d'interaction
  IF p_interaction_type = 'swipe_right' OR p_interaction_type = 'favorite' THEN
    -- Interaction positive: augmenter les poids
    UPDATE user_learned_preferences 
    SET 
      cuisine_weights = cuisine_weights || 
        (SELECT jsonb_object_agg(cuisine, LEAST(1.0, COALESCE((cuisine_weights->>cuisine)::numeric, 0.5) + learning_rate))
         FROM unnest(cuisine_types) AS cuisine),
      price_preferences = price_preferences || 
        jsonb_build_object(price_range, LEAST(1.0, COALESCE((price_preferences->>price_range)::numeric, 0.5) + learning_rate)),
      last_updated = now()
    WHERE user_id = p_user_id;
    
  ELSIF p_interaction_type = 'swipe_left' THEN
    -- Interaction négative: diminuer les poids
    UPDATE user_learned_preferences 
    SET 
      cuisine_weights = cuisine_weights || 
        (SELECT jsonb_object_agg(cuisine, GREATEST(0.0, COALESCE((cuisine_weights->>cuisine)::numeric, 0.5) - learning_rate))
         FROM unnest(cuisine_types) AS cuisine),
      price_preferences = price_preferences || 
        jsonb_build_object(price_range, GREATEST(0.0, COALESCE((price_preferences->>price_range)::numeric, 0.5) - learning_rate)),
      last_updated = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Trigger pour mettre à jour automatiquement les préférences apprises
CREATE OR REPLACE FUNCTION public.trigger_update_learned_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Récupérer les données du restaurant et appeler la fonction d'apprentissage
  IF NEW.interaction_type IN ('swipe_right', 'swipe_left', 'favorite', 'unfavorite') THEN
    PERFORM public.update_learned_preferences(
      NEW.user_id,
      NEW.restaurant_id,
      NEW.interaction_type,
      NEW.context_data
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER trigger_learn_from_interactions
  AFTER INSERT OR UPDATE ON public.user_restaurant_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_learned_preferences();