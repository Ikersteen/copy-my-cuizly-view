-- Enable real-time updates for ratings table
ALTER TABLE public.ratings REPLICA IDENTITY FULL;

-- Add the ratings table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;