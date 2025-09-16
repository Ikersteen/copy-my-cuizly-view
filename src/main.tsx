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

// Ensure i18n is ready before rendering
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  );
};

// Wait for i18n to be initialized
if (i18n.isInitialized) {
  renderApp();
} else {
  i18n.on('initialized', renderApp);
}
