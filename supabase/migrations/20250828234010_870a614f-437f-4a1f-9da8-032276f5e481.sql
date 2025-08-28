-- Fix RLS policies for analytics tracking
-- The issue is that upsert doesn't work properly with RLS, we need different approach

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can track analytics" ON restaurant_analytics;
DROP POLICY IF EXISTS "Authenticated users can update analytics" ON restaurant_analytics;

-- Create a function to handle analytics safely
CREATE OR REPLACE FUNCTION public.track_profile_view(p_restaurant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO restaurant_analytics (
    restaurant_id,
    date,
    profile_views,
    menu_views,
    offer_clicks,
    average_rating,
    rating_count
  ) VALUES (
    p_restaurant_id,
    CURRENT_DATE,
    1,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (restaurant_id, date)
  DO UPDATE SET
    profile_views = restaurant_analytics.profile_views + 1,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.track_profile_view(uuid) TO authenticated;