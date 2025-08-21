-- Enable realtime for user_preferences table
ALTER TABLE public.user_preferences REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;