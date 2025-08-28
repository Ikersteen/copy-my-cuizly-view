-- Corriger la valeur par défaut du rayon de livraison pour qu'elle soit de 1km au lieu de 0km
ALTER TABLE public.user_preferences 
ALTER COLUMN delivery_radius SET DEFAULT 1;