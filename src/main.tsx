import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set document title in French
document.title = 'Cuizly - Ton prochain coup de cœur culinaire en un swipe';

createRoot(document.getElementById("root")!).render(<App />);
