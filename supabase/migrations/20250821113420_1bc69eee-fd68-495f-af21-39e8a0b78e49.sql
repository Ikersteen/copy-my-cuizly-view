-- Create menus table for restaurant menu items
CREATE TABLE public.menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(description) <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Create policies for menus
CREATE POLICY "Restaurant owners can manage their menus" 
ON public.menus 
FOR ALL 
USING (restaurant_id IN ( SELECT restaurants.id FROM restaurants WHERE (restaurants.owner_id = auth.uid())));

CREATE POLICY "Anyone can view active menus" 
ON public.menus 
FOR SELECT 
USING (is_active = true);

-- Add cover image to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN cover_image_url TEXT;