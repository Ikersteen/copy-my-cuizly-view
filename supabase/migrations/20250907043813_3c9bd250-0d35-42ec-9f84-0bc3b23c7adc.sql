-- Fix Security Definer View issue by removing the problematic view
-- The secure_waitlist_view uses SECURITY DEFINER functions which bypass RLS

-- Drop the problematic view
DROP VIEW IF EXISTS public.secure_waitlist_view;

-- The security issue is resolved as we already have secure functions:
-- - get_waitlist_data_ultra_secure() for ultra-secure access
-- - get_waitlist_entries_secure() for standard secure access
-- These functions properly handle security without the SECURITY DEFINER view vulnerability

-- Add a comment to document the security fix
COMMENT ON FUNCTION public.get_waitlist_data_ultra_secure IS 'Secure function replacement for removed SECURITY DEFINER view. Provides ultra-secure access to waitlist data with comprehensive audit logging and rate limiting.';