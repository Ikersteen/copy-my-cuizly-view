import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n' // Initialize i18n
import { Suspense } from 'react'

// Set document title in French
document.title = 'Cuizly';

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<div>Loading...</div>}>
    <App />
  </Suspense>
);
