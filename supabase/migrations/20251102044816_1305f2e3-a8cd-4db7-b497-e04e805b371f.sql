-- Create menus table
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  cuisine_type TEXT[],
  dietary_restrictions TEXT[],
  allergens TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create comments/ratings table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant_analytics table
CREATE TABLE public.restaurant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  profile_views INTEGER NOT NULL DEFAULT 0,
  menu_views INTEGER NOT NULL DEFAULT 0,
  offer_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Enable RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menus
CREATE POLICY "Public can view active menus" ON public.menus FOR SELECT USING (is_active = true);
CREATE POLICY "Restaurant owners can manage their menus" ON public.menus FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = menus.restaurant_id AND restaurants.owner_id = auth.uid())
);

-- RLS Policies for offers
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT USING (is_active = true);
CREATE POLICY "Restaurant owners can manage their offers" ON public.offers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = offers.restaurant_id AND restaurants.owner_id = auth.uid())
);

-- RLS Policies for comments
CREATE POLICY "Public can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for restaurant_analytics
CREATE POLICY "Restaurant owners can view their analytics" ON public.restaurant_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = restaurant_analytics.restaurant_id AND restaurants.owner_id = auth.uid())
);
CREATE POLICY "Restaurant owners can insert analytics" ON public.restaurant_analytics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = restaurant_analytics.restaurant_id AND restaurants.owner_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX idx_menus_restaurant_id ON public.menus(restaurant_id);
CREATE INDEX idx_offers_restaurant_id ON public.offers(restaurant_id);
CREATE INDEX idx_comments_restaurant_id ON public.comments(restaurant_id);
CREATE INDEX idx_restaurant_analytics_restaurant_id ON public.restaurant_analytics(restaurant_id);
CREATE INDEX idx_restaurant_analytics_date ON public.restaurant_analytics(date);

-- Create update triggers for updated_at
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();