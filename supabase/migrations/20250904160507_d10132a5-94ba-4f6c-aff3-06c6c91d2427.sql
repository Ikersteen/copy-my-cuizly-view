-- Create function to get offers with restaurant names for consumers
CREATE OR REPLACE FUNCTION get_offers_with_restaurant_names(category_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  restaurant_id uuid,
  title text,
  description text,
  discount_percentage integer,
  discount_amount numeric,
  valid_until timestamp with time zone,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  category text,
  cuisine_type text,
  restaurant_name text,
  restaurant_cuisine_type text[],
  restaurant_price_range text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.restaurant_id,
    o.title,
    o.description,
    o.discount_percentage,
    o.discount_amount,
    o.valid_until,
    o.is_active,
    o.created_at,
    o.updated_at,
    o.category,
    o.cuisine_type,
    r.name as restaurant_name,
    r.cuisine_type as restaurant_cuisine_type,
    r.price_range as restaurant_price_range
  FROM offers o
  LEFT JOIN restaurants r ON o.restaurant_id = r.id
  WHERE o.is_active = true
    AND (category_filter IS NULL OR o.category = category_filter)
  ORDER BY o.created_at DESC;
END;
$$;