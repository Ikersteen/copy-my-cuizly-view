-- Add voice_activation_enabled column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS voice_activation_enabled BOOLEAN DEFAULT false;