import { useEffect } from 'react';

interface UserData {
  preferences?: any;
  formData?: any;
  userType?: string;
  [key: string]: any;
}

const STORAGE_KEY = 'cuizly_temp_data';

export const useDataPersistence = () => {
  // Save data to localStorage
  const saveTemporaryData = (data: UserData) => {
    try {
      const existingData = getTemporaryData();
      const mergedData = { ...existingData, ...data, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
      console.log('✅ Données temporaires sauvegardées:', mergedData);
    } catch (error) {
      console.error('❌ Erreur sauvegarde données temporaires:', error);
    }
  };

  // Get data from localStorage
  const getTemporaryData = (): UserData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      
      const data = JSON.parse(stored);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      // Delete expired data (older than 1 hour)
      if (data.timestamp && now - data.timestamp > oneHour) {
        console.log('🗑️ Données temporaires expirées, suppression');
        clearTemporaryData();
        return {};
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erreur lecture données temporaires:', error);
      return {};
    }
  };

  // Clear temporary data
  const clearTemporaryData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ Données temporaires supprimées');
    } catch (error) {
      console.error('❌ Erreur suppression données temporaires:', error);
    }
  };

  // Restore data after authentication
  const restoreDataAfterAuth = async () => {
    try {
      const tempData = getTemporaryData();
      
      if (Object.keys(tempData).length > 0) {
        console.log('🔄 Restauration des données après connexion:', tempData);
        
        // Trigger events to restore data in relevant components
        if (tempData.preferences) {
          window.dispatchEvent(new CustomEvent('restorePreferences', { 
            detail: tempData.preferences 
          }));
        }
        
        if (tempData.formData) {
          window.dispatchEvent(new CustomEvent('restoreFormData', { 
            detail: tempData.formData 
          }));
        }
        
        // Clear temporary data after restoration
        setTimeout(() => {
          clearTemporaryData();
        }, 1000);
        
        return tempData;
      }
    } catch (error) {
      console.error('❌ Erreur restauration données:', error);
    }
    
    return null;
  };

  return {
    saveTemporaryData,
    getTemporaryData,
    clearTemporaryData,
    restoreDataAfterAuth
  };
};