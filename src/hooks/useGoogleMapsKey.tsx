import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMapsKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke(
          'get-google-maps-key'
        );

        if (functionError) {
          throw functionError;
        }

        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          throw new Error('No API key received');
        }
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch API key');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
};