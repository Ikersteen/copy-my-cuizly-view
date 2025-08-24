-- Create ratings table for restaurant reviews
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own ratings" 
ON public.ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view ratings" 
ON public.ratings 
FOR SELECT 
USING (true);

-- Create analytics table for real-time tracking
CREATE TABLE public.restaurant_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INTEGER DEFAULT 0,
  menu_views INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  offer_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Enable RLS
ALTER TABLE public.restaurant_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Restaurant owners can view their analytics" 
ON public.restaurant_analytics 
FOR SELECT 
USING (restaurant_id IN (
  SELECT restaurants.id FROM restaurants 
  WHERE restaurants.owner_id = auth.uid()
));

CREATE POLICY "System can insert analytics" 
ON public.restaurant_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update analytics" 
ON public.restaurant_analytics 
FOR UPDATE 
USING (true);

-- Create function to update analytics
CREATE OR REPLACE FUNCTION update_restaurant_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics based on the trigger
  IF TG_TABLE_NAME = 'ratings' THEN
    INSERT INTO public.restaurant_analytics (restaurant_id, rating_count, average_rating)
    VALUES (
      NEW.restaurant_id, 
      1,
      NEW.rating
    )
    ON CONFLICT (restaurant_id, date)
    DO UPDATE SET
      rating_count = restaurant_analytics.rating_count + 1,
      average_rating = (
        SELECT AVG(rating) 
        FROM public.ratings 
        WHERE restaurant_id = NEW.restaurant_id
      ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for real-time analytics
CREATE TRIGGER update_analytics_on_rating
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_analytics();

-- Create trigger for timestamp updates
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at
  BEFORE UPDATE ON public.restaurant_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for analytics
ALTER TABLE public.restaurant_analytics REPLICA IDENTITY FULL;
ALTER TABLE public.ratings REPLICA IDENTITY FULL;