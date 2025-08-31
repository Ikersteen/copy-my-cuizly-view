-- Remove the restaurants_public view entirely to resolve Security Definer View issue
-- The linter may be flagging this view because it's owned by the postgres superuser

DROP VIEW IF EXISTS public.restaurants_public;

-- Note: Public access to restaurant data should use the get_public_restaurants() function
-- which is now properly configured as SECURITY INVOKER and excludes sensitive contact info