import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode is intentionally omitted: it double-invokes effects in dev,
// which causes MapLibre GL to silently fail on its second container init.
createRoot(document.getElementById('root')!).render(<App />)
