import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import i18n from './lib/i18n' // Initialize i18n
import { Suspense } from 'react'
import { initSentry } from './lib/sentry'

// Initialiser Sentry pour le monitoring de sécurité A+
initSentry();

// Set document title in French
document.title = 'Cuizly';

// Ensure i18n is ready and language is loaded before rendering
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  );
};

// Better initialization with language persistence
const initializeApp = () => {
  // Force French as default language
  const savedLanguage = localStorage.getItem('cuizly-language') || 'fr';
  console.log('🔧 Initializing language:', savedLanguage);
  
  if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
    i18n.changeLanguage(savedLanguage).then(() => {
      renderApp();
    });
  } else {
    // Default to French
    localStorage.setItem('cuizly-language', 'fr');
    i18n.changeLanguage('fr').then(() => {
      renderApp();
    });
  }
};

// Wait for i18n to be initialized
if (i18n.isInitialized) {
  initializeApp();
} else {
  i18n.on('initialized', initializeApp);
}
