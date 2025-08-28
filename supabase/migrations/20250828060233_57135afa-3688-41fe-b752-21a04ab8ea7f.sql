-- Test d'insertion manuelle pour vérifier si le dashboard fonctionne
INSERT INTO public.restaurant_analytics (
  restaurant_id,
  date,
  profile_views,
  menu_views,
  offer_clicks
) VALUES (
  'ea477233-e8ec-4e15-aadd-8d2f5185fc39',
  CURRENT_DATE,
  5,
  3,
  2
);