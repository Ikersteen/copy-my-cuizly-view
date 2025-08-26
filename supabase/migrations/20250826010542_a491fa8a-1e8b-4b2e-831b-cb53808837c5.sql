-- Fix security issue: Remove unused restaurants_public view that exposes restaurant data
-- The application already uses get_public_restaurants() function which is secure
-- This view is not used in the codebase but poses a security risk

DROP VIEW IF EXISTS public.restaurants_public;