-- Enable realtime for user_favorites table
ALTER TABLE public.user_favorites REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_favorites;