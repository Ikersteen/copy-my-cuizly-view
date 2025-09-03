-- Enhanced security for waitlist_analytics table - Part 2: Update RLS Policies
-- Drop existing policies and create new secure ones

-- Drop all existing policies for clean slate
DROP POLICY IF EXISTS "Public can insert into waitlist" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Validated public can insert into waitlist" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Only admins can read waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Verified admins can read waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "No updates allowed on waitlist entries" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "No deletes allowed on waitlist entries" ON public.waitlist_analytics;

-- Create new secure policies
CREATE POLICY "Validated public can insert into waitlist"
ON public.waitlist_analytics
FOR INSERT
WITH CHECK (
  public.validate_waitlist_entry(email, name, company_name, phone) = true
);

CREATE POLICY "Verified admins can read waitlist entries"
ON public.waitlist_analytics
FOR SELECT
USING (public.verify_admin_access() = true);

-- Completely block updates and deletes for data integrity
CREATE POLICY "No updates allowed on waitlist entries"
ON public.waitlist_analytics
FOR UPDATE
USING (false);

CREATE POLICY "No deletes allowed on waitlist entries"
ON public.waitlist_analytics
FOR DELETE
USING (false);