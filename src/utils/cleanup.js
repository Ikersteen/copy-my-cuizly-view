// Script de nettoyage automatique des console.log
// Cet utilitaire aide à identifier et nettoyer les console.log en développement

export const cleanupLogs = () => {
  // En production, remplacer tous les console.log par des no-op
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
  }
};

// Fonction pour conserver uniquement les logs critiques
export const keepCriticalLogs = () => {
  const originalLog = console.log;
  console.log = (...args) => {
    // Conserver seulement les logs contenant "Error", "❌", "🚨"
    if (args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('Error') || arg.includes('❌') || arg.includes('🚨'))
    )) {
      originalLog(...args);
    }
  };
};