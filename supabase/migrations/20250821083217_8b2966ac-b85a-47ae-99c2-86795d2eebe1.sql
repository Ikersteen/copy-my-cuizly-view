-- Add foreign key constraints for proper relationships
ALTER TABLE public.offers 
ADD CONSTRAINT fk_offers_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.user_favorites 
ADD CONSTRAINT fk_favorites_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;