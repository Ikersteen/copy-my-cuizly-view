-- Créer la table pour les logs d'activité utilisateur
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_session_id ON public.user_activity_logs(session_id);
CREATE INDEX idx_user_activity_logs_event_type ON public.user_activity_logs(event_type);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_page_url ON public.user_activity_logs(page_url);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Seuls les admins peuvent lire les logs
CREATE POLICY "Only admins can view activity logs"
ON public.user_activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Le système peut insérer (pour le tracking client)
CREATE POLICY "System can insert activity logs"
ON public.user_activity_logs
FOR INSERT
WITH CHECK (true);

-- Policy: Les admins peuvent tout faire
CREATE POLICY "Admins can manage activity logs"
ON public.user_activity_logs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fonction pour enregistrer l'activité (security definer)
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_session_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_page_url TEXT DEFAULT NULL,
  p_page_title TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
  parsed_user_agent TEXT;
  device_info TEXT;
  browser_info TEXT;
  os_info TEXT;
BEGIN
  current_user_id := auth.uid();
  
  -- Parser le user agent (simplifié)
  parsed_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  
  -- Détection basique du device
  device_info := CASE
    WHEN parsed_user_agent ILIKE '%mobile%' OR parsed_user_agent ILIKE '%android%' THEN 'mobile'
    WHEN parsed_user_agent ILIKE '%tablet%' OR parsed_user_agent ILIKE '%ipad%' THEN 'tablet'
    ELSE 'desktop'
  END;
  
  -- Détection basique du browser
  browser_info := CASE
    WHEN parsed_user_agent ILIKE '%chrome%' AND parsed_user_agent NOT ILIKE '%edg%' THEN 'Chrome'
    WHEN parsed_user_agent ILIKE '%safari%' AND parsed_user_agent NOT ILIKE '%chrome%' THEN 'Safari'
    WHEN parsed_user_agent ILIKE '%firefox%' THEN 'Firefox'
    WHEN parsed_user_agent ILIKE '%edg%' THEN 'Edge'
    ELSE 'Other'
  END;
  
  -- Détection basique de l'OS
  os_info := CASE
    WHEN parsed_user_agent ILIKE '%windows%' THEN 'Windows'
    WHEN parsed_user_agent ILIKE '%mac%' THEN 'macOS'
    WHEN parsed_user_agent ILIKE '%linux%' THEN 'Linux'
    WHEN parsed_user_agent ILIKE '%android%' THEN 'Android'
    WHEN parsed_user_agent ILIKE '%ios%' OR parsed_user_agent ILIKE '%iphone%' OR parsed_user_agent ILIKE '%ipad%' THEN 'iOS'
    ELSE 'Other'
  END;
  
  INSERT INTO public.user_activity_logs (
    user_id,
    session_id,
    event_type,
    event_data,
    page_url,
    page_title,
    referrer,
    user_agent,
    ip_address,
    device_type,
    browser,
    os,
    duration_seconds
  ) VALUES (
    current_user_id,
    p_session_id,
    p_event_type,
    p_event_data,
    p_page_url,
    p_page_title,
    p_referrer,
    parsed_user_agent,
    inet_client_addr(),
    device_info,
    browser_info,
    os_info,
    p_duration_seconds
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Fonction pour obtenir les statistiques (pour admins)
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE(
  total_events BIGINT,
  unique_users BIGINT,
  unique_sessions BIGINT,
  total_page_views BIGINT,
  avg_session_duration NUMERIC,
  top_pages JSONB,
  event_breakdown JSONB,
  device_breakdown JSONB,
  browser_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(*) FILTER (WHERE event_type = 'page_view') as total_page_views,
      AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL) as avg_duration
    FROM public.user_activity_logs
    WHERE created_at BETWEEN start_date AND end_date
  ),
  top_pages_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'page', page_url,
        'views', view_count
      ) ORDER BY view_count DESC
    ) as pages
    FROM (
      SELECT page_url, COUNT(*) as view_count
      FROM public.user_activity_logs
      WHERE created_at BETWEEN start_date AND end_date
        AND event_type = 'page_view'
      GROUP BY page_url
      ORDER BY view_count DESC
      LIMIT 10
    ) t
  ),
  events_data AS (
    SELECT jsonb_object_agg(event_type, event_count) as events
    FROM (
      SELECT event_type, COUNT(*) as event_count
      FROM public.user_activity_logs
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY event_type
    ) t
  ),
  devices_data AS (
    SELECT jsonb_object_agg(device_type, device_count) as devices
    FROM (
      SELECT COALESCE(device_type, 'unknown') as device_type, COUNT(*) as device_count
      FROM public.user_activity_logs
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY device_type
    ) t
  ),
  browsers_data AS (
    SELECT jsonb_object_agg(browser, browser_count) as browsers
    FROM (
      SELECT COALESCE(browser, 'unknown') as browser, COUNT(*) as browser_count
      FROM public.user_activity_logs
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY browser
    ) t
  )
  SELECT
    s.total_events,
    s.unique_users,
    s.unique_sessions,
    s.total_page_views,
    ROUND(s.avg_duration::numeric, 2) as avg_session_duration,
    COALESCE(p.pages, '[]'::jsonb) as top_pages,
    COALESCE(e.events, '{}'::jsonb) as event_breakdown,
    COALESCE(d.devices, '{}'::jsonb) as device_breakdown,
    COALESCE(b.browsers, '{}'::jsonb) as browser_breakdown
  FROM stats s
  CROSS JOIN top_pages_data p
  CROSS JOIN events_data e
  CROSS JOIN devices_data d
  CROSS JOIN browsers_data b;
END;
$$;