-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reservation', 'comment', 'favorite', 'offer', 'reminder', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_notification_type CHECK (type IN ('reservation', 'comment', 'favorite', 'offer', 'reminder', 'system'))
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Trigger to create notification when new reservation is made
CREATE OR REPLACE FUNCTION public.notify_new_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_owner_id UUID;
  restaurant_name TEXT;
BEGIN
  -- Get restaurant owner and name
  SELECT r.owner_id, r.name INTO restaurant_owner_id, restaurant_name
  FROM public.restaurants r
  WHERE r.id = NEW.restaurant_id;
  
  IF restaurant_owner_id IS NOT NULL THEN
    -- Notify restaurant owner
    PERFORM public.create_notification(
      restaurant_owner_id,
      'Nouvelle réservation',
      'Nouvelle réservation pour ' || NEW.party_size || ' personnes le ' || 
      TO_CHAR(NEW.reservation_date, 'DD/MM/YYYY') || ' à ' || 
      TO_CHAR(NEW.reservation_time, 'HH24:MI'),
      'reservation',
      '/restaurant-reservations',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'customer_name', NEW.customer_name,
        'party_size', NEW.party_size,
        'restaurant_name', restaurant_name
      )
    );
  END IF;
  
  -- Notify customer
  PERFORM public.create_notification(
    NEW.user_id,
    'Réservation confirmée',
    'Votre réservation chez ' || restaurant_name || ' pour ' || NEW.party_size || 
    ' personnes le ' || TO_CHAR(NEW.reservation_date, 'DD/MM/YYYY') || ' à ' || 
    TO_CHAR(NEW.reservation_time, 'HH24:MI') || ' est confirmée',
    'reservation',
    '/consumer-reservations',
    jsonb_build_object(
      'reservation_id', NEW.id,
      'restaurant_name', restaurant_name
    )
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_reservation();

-- Trigger to notify when comment is added
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_owner_id UUID;
  restaurant_name TEXT;
  commenter_name TEXT;
BEGIN
  -- Get restaurant owner and name
  SELECT r.owner_id, r.name INTO restaurant_owner_id, restaurant_name
  FROM public.restaurants r
  WHERE r.id = NEW.restaurant_id;
  
  -- Get commenter name
  SELECT COALESCE(p.first_name || ' ' || p.last_name, p.username, 'Un utilisateur')
  INTO commenter_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  IF restaurant_owner_id IS NOT NULL THEN
    PERFORM public.create_notification(
      restaurant_owner_id,
      'Nouveau commentaire',
      commenter_name || ' a laissé un commentaire' || 
      CASE WHEN NEW.rating IS NOT NULL THEN ' avec ' || NEW.rating || '⭐' ELSE '' END,
      'comment',
      '/restaurant-dashboard',
      jsonb_build_object(
        'comment_id', NEW.id,
        'rating', NEW.rating,
        'restaurant_name', restaurant_name,
        'commenter_name', commenter_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

-- Trigger to notify when restaurant is favorited
CREATE OR REPLACE FUNCTION public.notify_new_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_owner_id UUID;
  restaurant_name TEXT;
  user_name TEXT;
BEGIN
  -- Get restaurant owner and name
  SELECT r.owner_id, r.name INTO restaurant_owner_id, restaurant_name
  FROM public.restaurants r
  WHERE r.id = NEW.restaurant_id;
  
  -- Get user name
  SELECT COALESCE(p.first_name || ' ' || p.last_name, p.username, 'Un utilisateur')
  INTO user_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  IF restaurant_owner_id IS NOT NULL THEN
    PERFORM public.create_notification(
      restaurant_owner_id,
      'Nouveau favori ⭐',
      user_name || ' a ajouté ' || restaurant_name || ' à ses favoris !',
      'favorite',
      '/restaurant-dashboard',
      jsonb_build_object(
        'restaurant_name', restaurant_name,
        'user_name', user_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_favorite
  AFTER INSERT ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_favorite();