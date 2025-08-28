-- Add dietary restrictions and allergens columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN dietary_restrictions text[] DEFAULT '{}',
ADD COLUMN allergens text[] DEFAULT '{}';