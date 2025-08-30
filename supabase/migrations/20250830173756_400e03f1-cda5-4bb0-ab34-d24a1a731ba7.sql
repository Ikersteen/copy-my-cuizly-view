-- Create waitlist table for Analytics+ interested users
CREATE TABLE public.waitlist_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  restaurant_type TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for signups)
CREATE POLICY "Anyone can insert into waitlist" 
ON public.waitlist_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admin to read all entries
CREATE POLICY "Only admins can read waitlist entries" 
ON public.waitlist_analytics 
FOR SELECT 
USING (false); -- This will be updated when we have admin roles

-- Add unique constraint on email to prevent duplicates
ALTER TABLE public.waitlist_analytics ADD CONSTRAINT unique_waitlist_email UNIQUE (email);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_waitlist_analytics_updated_at
BEFORE UPDATE ON public.waitlist_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();