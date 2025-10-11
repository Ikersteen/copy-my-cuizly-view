import { useState, useEffect } from 'react';

export const useGoogleMapsKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pour l'instant, retourner null car le système de maps a été retiré
    // Si vous avez besoin de réactiver Google Maps, ajoutez votre clé API ici
    setApiKey(null);
    setLoading(false);
  }, []);

  return { apiKey, loading, error };
};
