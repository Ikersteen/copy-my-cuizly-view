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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <img 
            src="/cuizly-logo-official.png" 
            alt="Cuizly" 
            className="w-32 h-32 object-contain animate-pulse"
          />
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    }>
      <App />
    </Suspense>
  );
};

// Better initialization with language persistence
const initializeApp = () => {
  // Ensure the saved language is loaded
  const savedLanguage = localStorage.getItem('cuizly-language');
  if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
    i18n.changeLanguage(savedLanguage).then(() => {
      renderApp();
    });
  } else {
    // Default to French if no valid language is saved
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
