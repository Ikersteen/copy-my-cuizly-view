-- Clean up duplicate user preferences, keeping only the most recent one
DELETE FROM user_preferences 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_preferences 
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);