import { useState, useEffect } from "react";

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: 'restaurant' | 'cuisine' | 'location';
  timestamp: Date;
  restaurant?: {
    id: string;
    name: string;
    cuisine_type?: string[];
    address?: string;
  };
}

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('searchHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir les timestamps en objets Date
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setSearchHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setSearchHistory([]);
    }
  };

  const addSearchItem = (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: SearchHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const updatedHistory = [newItem, ...searchHistory].slice(0, 50); // Garder seulement les 50 dernières recherches
    setSearchHistory(updatedHistory);
    
    try {
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const removeSearchItem = (id: string) => {
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    
    try {
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  };

  return {
    searchHistory,
    addSearchItem,
    clearHistory,
    removeSearchItem,
    loadHistory
  };
};