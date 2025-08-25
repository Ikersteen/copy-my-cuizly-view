-- Enable real-time updates for profiles table  
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add the profiles table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;