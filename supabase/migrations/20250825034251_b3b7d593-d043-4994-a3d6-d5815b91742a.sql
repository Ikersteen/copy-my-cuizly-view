-- Enable real-time updates for ratings table
ALTER TABLE public.ratings REPLICA IDENTITY FULL;

-- Enable real-time updates for comments table  
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Enable real-time updates for restaurants table
ALTER TABLE public.restaurants REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;