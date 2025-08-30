-- Install HTTP extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Update the function to use the correct extension schema
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
  
  -- Make HTTP request to edge function using extensions schema
  SELECT * INTO http_response FROM extensions.http((
    'POST',
    function_url,
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || service_role_key),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'email', NEW.email,
      'name', NEW.name
    )::text
  )::extensions.http_request);
  
  -- Log the response for debugging
  RAISE NOTICE 'Waitlist confirmation email response: %', http_response.content;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the trigger
    RAISE NOTICE 'Error sending confirmation email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';