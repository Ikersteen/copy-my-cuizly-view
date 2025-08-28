-- Enable realtime for restaurant_analytics table
ALTER TABLE public.restaurant_analytics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_analytics;

-- Enable realtime for ratings table  
ALTER TABLE public.ratings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;

-- Enable realtime for offers table
ALTER TABLE public.offers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

-- Enable realtime for menus table
ALTER TABLE public.menus REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;

-- Enable realtime for comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;