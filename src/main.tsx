import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set document title in French
document.title = 'Cuizly - Plateforme de Restauration Montréalaise';

createRoot(document.getElementById("root")!).render(<App />);
