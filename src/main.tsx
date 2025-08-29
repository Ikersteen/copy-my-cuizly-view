import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n' // Initialize i18n

// Set document title in French
document.title = 'Cuizly';

createRoot(document.getElementById("root")!).render(<App />);
