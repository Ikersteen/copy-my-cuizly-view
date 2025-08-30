-- Create function to send waitlist confirmation email
CREATE OR REPLACE FUNCTION public.send_waitlist_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  function_url TEXT;
  http_response RECORD;
BEGIN
  -- Get Supabase configuration
  supabase_url := 'https://ffgkzvnbsdnfgmcxturx.supabase.co';
  service_role_key := current_setting('app.settings.service_role_key', true);
  function_url := supabase_url || '/functions/v1/send-waitlist-confirmation';
  
  -- Make HTTP request to edge function
  SELECT * INTO http_response FROM http((
    'POST',
    function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'email', NEW.email,
      'name', NEW.name
    )::text
  )::http_request);
  
  -- Log the response
  RAISE NOTICE 'Waitlist confirmation email response: %', http_response.content;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send confirmation email on waitlist signup
DROP TRIGGER IF EXISTS send_waitlist_confirmation_trigger ON waitlist_analytics;
CREATE TRIGGER send_waitlist_confirmation_trigger
  AFTER INSERT ON waitlist_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.send_waitlist_confirmation_email();